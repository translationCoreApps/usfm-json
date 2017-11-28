import * as USFM from './USFM';

/**
 * @description - Finds all of the regex matches in a string
 * @param {String} string - the string to find matches in
 * @param {RegExp} regex - the RegExp to find matches with, must use global flag /.../g
 * @return {Array} - array of results
*/
export const getMatches = (string, regex) => {
  let matches = [];
  let match;
  if (string.match(regex)) { // check so you don't get caught in a loop
    while ((match = regex.exec(string))) {
      // preserve white space
      let nextChar = null;
      const endPos = match.index + match[0].length;
      if(endPos >= string.length) {
        nextChar = "\n"; // save new line
      } else {
        let char = string[endPos];
        if (char === ' ') {
          nextChar = char; // save space
        }
      }
      if (nextChar) {
        match['nextChar'] = nextChar;
      }
      matches.push(match);
    }
  }
  return matches;
};

/**
 * @description - Parses the marker that opens and describes content
 * @param {String} markerOpen - the string that contains the marker '\v 1', '\p', ...
 * @return {Object} - the object of tag and number if it exists
*/
export const parseMarkerOpen = markerOpen => {
  let object = {};
  if (markerOpen) {
    const regex = /(\w+)\s*(\d*)/g;
    const matches = exports.getMatches(markerOpen, regex);
    object = {
      tag: matches[0][1],
      number: matches[0][2]
    };
  }
  return object;
};

/**
 * @description - Parses the word marker into JSON
 * @param {String} wordContent - the string to find the data/attributes
 * @return {Object} - json object of the word attributes
*/
export const parseWord = wordContent => {
  let object = {};
  const wordParts = wordContent.split('|');
  const word = wordParts[0];
  const attributeContent = wordParts[1];
  object = {
    word: word,
    tag: 'w'
  };
  const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
  const matches = exports.getMatches(attributeContent, regex);
  matches.forEach(function(match) {
    object[match[1]] = match[2];
  });
  return object;
};

/**
 * @description - Parses the line and determines what content is in it
 * @param {String} line - the string to find the markers and content
 * @return {Array} - array of objects that describe open/close and content
*/
export const parseLine = line => {
  let array = [];
  if (line.trim() === '') {
    return array;
  }
  const regex = /([^\\]+)?\\(\w+\s*\d*)(?!\w)\s*([^\\]+)?(\\\w\*)?/g;
  const matches = exports.getMatches(line, regex);
  if (regex.exec(line)) { // normal formatting with marker followed by content
    matches.forEach(function(match) {
      const orphan = match[1] ? match[1].trim() : undefined;
      if (orphan) {
        const object = {content: orphan};
        array.push(object);
      }
      const open = match[2] ? match[2].trim() : undefined;
      const content = match[3] ? match[3].trim() : undefined;
      const close = match[4] ? match[4].trim() : undefined;
      let marker = exports.parseMarkerOpen(open);
      const object = {
        open: open,
        tag: marker.tag,
        number: marker.number,
        content: content,
        close: close
      };
      if (match.nextChar) {
        object['nextChar'] = match.nextChar;
      }
      array.push(object);
    });
    // check for leftover text at end of line
    if (matches.length) {
      const lastMatch = matches[matches.length - 1];
      const endPos = lastMatch.index + lastMatch[0].length;
      if (endPos < line.length) {
        const object = {
          content: line.substr(endPos) + '\n'
        };
        array.push(object);
      }
    }
  } else { // doesn't have a marker but may have content
    // this is considered an orphaned line
    const object = {
      content: line + '\n'
    };
    array.push(object);
  }
  return array;
};

/**
 * @description - get location for chapter/verse, if location doesn't exist, create it.
 * @param {array} chapters - holds all chpater content
 * @param {int} currentChapter - current chapter
 * @param {int} currentVerse - current verse
 * @return {array} location to place verse content
 */
export const getSaveToLocation = (chapters, currentChapter, currentVerse) => {
  if (!chapters[currentChapter][currentVerse])
    chapters[currentChapter][currentVerse] = [];

  return chapters[currentChapter][currentVerse];
};

/**
 * @description - rollback nested to endpoint for this tag
 * @param {array} saveTo - location to place verse content
 * @param {String} content - usfm marker content
 * @param {array} nested - points to object that contains nested content such as for '\f'
 * @param {array} chapters - holds all chapter content
 * @param {String} tag - usfm marker tag
 * @param {int} currentChapter - current chapter
 * @param {int} currentVerse - current verse
 */
export const unPopNestedMarker = (saveTo, content, nested, chapters, tag, currentChapter, currentVerse) => {
  let extra = content.substr(1); // pull out data after end marker
  if (extra && extra[0] === " ") {
    extra = extra.substr(1);
  }
  if (tag[tag.length-1] == "*") {
    tag = tag.substr(0,tag.length-1);
  }
  let found = false;
  for (let j = nested.length - 1; j >= 0; j--) {
    const stackTYpe = nested[j].tag;
    if (tag === stackTYpe) {
      while (nested.length > j) { // rollback nested to this point
        nested.pop();
      }
      saveTo = getSaveToLocation(chapters, currentChapter, currentVerse); // update where to put output
      found = true;
      break;
    }
  }
  if (!found) { // since nested and not in stack, add end marker to text content
    pushObject(nested, saveTo, '\\' + tag + '*');
  }
  if (extra) {
    pushObject(nested, saveTo, extra);
  }
};

/**
 * @description - check if object has close, if so then process it
 * @param saveTo
 * @param content
 * @param nested
 * @param chapters
 * @param usfmObject
 * @param currentChapter
 * @param currentVerse
 */
export const processClose = (saveTo, content, nested, chapters, usfmObject, currentChapter, currentVerse) => {
  const close = usfmObject.close;
  if (close && close.length && (close[0] === "\\")) {
    unPopNestedMarker(saveTo, "", nested, chapters, close.substr(1), currentChapter, currentVerse);
  }
};

/**
 * @description - save the usfm object to specified place and handle nested data
 * @param saveTo
 * @param nested
 * @param tag
 * @param usfmObject
 */
export const saveUsfmObject = (saveTo, nested, tag, usfmObject) => {
  const isNestedMarker = nested.length > 0;
  if (!isNestedMarker) {
    saveTo.push(usfmObject);
    if (USFM.markerRequiresTermination(tag)) { // need to handle nested data
      nested.push(usfmObject);
    }
  } else { // is nested
    pushObject(nested, saveTo, usfmObject);
  }
};

/**
 * @description - adds usfm object to current verse and handles nested USFM objects
 * @param nested
 * @param chapters
 * @param currentChapter
 * @param currentVerse
 * @param usfmObject
 * @param tag
 */
export const  addToCurrentVerse = (nested, chapters, currentChapter, currentVerse, usfmObject, tag=null) => {
  let saveTo = getSaveToLocation(chapters, currentChapter, currentVerse);
  tag = tag || usfmObject.tag;
  if (!tag) {
    pushObject(nested, saveTo, usfmObject);
    return;
  }

  let content = usfmObject.content;
  if (USFM.markerHasNoContent(tag)) {
    // separate marker and text
    const output = {
      tag: tag,
    };
    saveTo.push(output);
    if (usfmObject.nextChar === '\n') {
      content = (content || "") + usfmObject.nextChar;
    }
    if (content) {
      pushObject(nested, saveTo, content);
    }
  } else {
    const output = {
      tag: tag
    };
    if (usfmObject["number"]) {
      output.number = usfmObject.number;
    }

    const isEndMarker = (content && (content[0]==="*"));
    if (isEndMarker) { // check for end marker
      unPopNestedMarker(saveTo, content, nested, chapters, tag, currentChapter, currentVerse);
    } else {
      if (content) {
        output.content = content;
      }
      saveUsfmObject(saveTo, nested, tag, output);
    }
  }
  processClose(saveTo, content, nested, chapters, usfmObject, currentChapter, currentVerse);
};

/**
 * @description push text string to array, and concat strings of last array item is also string
 * @param saveTo
 * @param wordObject
 */
export const pushObject = (nested, saveTo, wordObject) => {
  const isNestedMarker = nested.length > 0;
  if (isNestedMarker) { // if this marker is nested in another marker, then we need to add to content as string
    const last = nested.length-1;
    let text = nested[last].content;
    if (typeof wordObject === "string") {
      text += ' ' + wordObject;
    } else {
      text += ' \\' + wordObject.tag;
      if (wordObject.content) {
        text += ' ' + wordObject.content;
      }
    }
    nested[last].content = text;
    return;
  }
  if (saveTo.length && (typeof wordObject === "string")) {
    // see if we can append to previous string
    const lastPos = saveTo.length-1;
    let lastObject = saveTo[lastPos];
    if (typeof lastObject === "string") {
      // see if we need to separate with space
      const lastChar = lastObject.length ? lastObject.substr(lastObject.length-1) : "";
      if (wordObject && (wordObject[0] !== '\n') && (lastChar !== '\n')) {
        lastObject += ' ';
      }
      lastObject += wordObject;
      saveTo[lastPos] = lastObject;
      return;
    }
  }
  saveTo.push(wordObject);
};

/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
export const usfmToJSON = (usfm, params = {}) => {
  USFM.init();
  const lines = usfm.match(/.*/g); // get all the lines
  let usfmJSON = {};
  let markers = [];
  lines.forEach(function(line) {
    const parsedLine = exports.parseLine(line.trim());
    markers = markers.concat(parsedLine);
  });
  let currentChapter = 0;
  let currentVerse = 0;
  let chapters = {};
  let verses = {};
  let headers = {};
  let nested = [];
  let onSameChapter = false;
  markers.forEach(function(marker) {
    switch (marker.tag) {
      case 'c': { // chapter
        nested = [];
        currentChapter = marker.number;
        chapters[currentChapter] = {};
        // resetting 'on same chapter' flag
        onSameChapter = false;
        currentVerse = 0;
        break;
      }
      case 'v': { // verse
        nested = [];
        marker.content = marker.content || "";
        if (marker.nextChar === "\n") {
          marker.content += marker.nextChar;
        }
        currentVerse = marker.number;
        if (params.chunk === true && !onSameChapter) {
          if (verses[currentVerse]) {
            onSameChapter = true;
            break;
          } else {
            verses[currentVerse] = [];
            verses[currentVerse].push(marker.content);
          }
        }
        if (chapters[currentChapter] && !onSameChapter) {
          // if the current chapter exists, not on same chapter, and there is content to store
          if (chapters[currentChapter][currentVerse]) {
            // If the verse already exists, then we are flagging as 'on the same chapter'
            onSameChapter = true;
            break;
          }
          chapters[currentChapter][currentVerse] = [];
          chapters[currentChapter][currentVerse].push(marker.content);
        }
        break;
      }
      case 'w': { // word
        const isNestedMarker = nested.length > 0;
        let saveTo = getSaveToLocation(chapters, currentChapter, currentVerse);
        if (!isNestedMarker) {
          const wordObject = exports.parseWord(marker.content);
          pushObject(nested, saveTo, wordObject);
        } else {
          const wordObject = {
            tag: 'w',
            content: marker.content
          };
          pushObject(nested, saveTo, wordObject);
        }
        if (marker.nextChar) {
          pushObject(nested, saveTo, marker.nextChar);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (currentChapter > 0 && currentVerse > 0 && marker.content) {
          addToCurrentVerse(nested, chapters, currentChapter, currentVerse, marker.content);
        }
        if (params.chunk && currentVerse > 0 && marker.content) {
          if (!verses[currentVerse])
            verses[currentVerse] = [];
          pushObject(nested, verses[currentVerse],marker.content);
        }
        break;
      }
      default: {
        if (currentChapter === 0 && !currentVerse) { // if we haven't seen chapter yet, its a header
          let value;
          marker.content = marker.content || ""; // replace undefined
          if (marker.number) { // if there is a number, prepend it to content
            value = marker.number + ' ' + marker.content;
          } else {
            value = marker.content;
          }
          headers[marker.tag] = value;
        }
        else if (currentChapter && currentVerse) {
          addToCurrentVerse(nested, chapters, currentChapter, currentVerse, marker);
        }
      }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  if (Object.keys(verses).length > 0) usfmJSON.verses = verses;
  return usfmJSON;
};
