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
      if (endPos >= string.length) {
        nextChar = "\n"; // save new line
      } else {
        let char = string[endPos];
        if (char === ' ') {
          nextChar = char; // save space
        }
      }
      if (nextChar) {
        match.nextChar = nextChar;
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
    text: word,
    tag: 'w',
    type: 'word'
  };
  const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
  const matches = exports.getMatches(attributeContent, regex);
  matches.forEach(function(match) {
    let key = match[1];
    if (key === "strongs") { // fix invalid 'strongs' key
      key = "strong";
    }
    object[key] = match[2];
  });
  return object;
};

/**
 * @description - make a marker object that contains the text
 * @param {string} text - text to embed in object
 * @return {{content: *}} new text marker
 */
export const makeTextMarker = text => {
  return {
    content: text
  };
};

/**
 * @description - Parses the line and determines what content is in it
 * @param {String} line - the string to find the markers and content
 * @return {Array} - array of objects that describe open/close and content
*/
export const parseLine = line => {
  let array = [];
  if (line.trim() === '') {
    const object = makeTextMarker(line + '\n');
    array.push(object);
    return array;
  }
  const regex = /([^\\]+)?\\(\w+\s*\d*)(?!\w)\s*([^\\]+)?(\\\w\*)?/g;
  const matches = getMatches(line, regex);
  let lastObject = null;
  if (regex.exec(line)) { // normal formatting with marker followed by content
    for (let match of matches) {
      const orphan = match[1];
      if (orphan) {
        const object = {content: orphan};
        array.push(object);
      }
      const open = match[2] ? match[2].trim() : undefined;
      const content = match[3] || undefined;
      const close = match[4] ? match[4].trim() : undefined;
      let marker = parseMarkerOpen(open);
      let object = {
        open: open,
        tag: marker.tag,
        number: marker.number,
        content: content
      };

      if (!content && !marker.number && (open !== match[2])) { // look for dropped white space
        object.content = match[2].substr(open.length);
      }

      if (marker.number && !USFM.markerSupportsNumbers(marker.tag)) { // this tag doesn't have number, move to content
        delete object.number;
        let newContent;
        const tagPos = match[0].indexOf(marker.tag);
        if (tagPos >= 0) {
          newContent = match[0].substr(tagPos + marker.tag.length + 1);
        } else {
          newContent = marker.number + ' ' + (content || "");
        }
        object.content = newContent;
      }
      if (close) {
        array.push(object);
        const closeTag = close.substr(1);
        const closeObject = {
          open: closeTag,
          tag: closeTag
        };
        object = closeObject;
      }
      if (match.nextChar) {
        object.nextChar = match.nextChar;
      }
      array.push(object);
      lastObject = object;
    }
    // check for leftover text at end of line
    if (matches.length) {
      const lastMatch = matches[matches.length - 1];
      const endPos = lastMatch.index + lastMatch[0].length;
      if (endPos < line.length) {
        let orphanText = line.substr(endPos) + '\n';
        if (lastObject && lastObject.nextChar &&
          (lastObject.nextChar === ' ')) {
          orphanText = orphanText.substr(1); // remove first space since already handled
        }
        const object = makeTextMarker(orphanText);
        array.push(object);
      }
    }
  } else { // doesn't have a marker but may have content
    // this is considered an orphaned line
    const object = makeTextMarker(line + '\n');
    array.push(object);
  }
  return array;
};

/**
 * @description - get location for chapter/verse, if location doesn't exist, create it.
 * @param {array} chapters - holds all chpater content
 * @param {string} currentChapter - current chapter
 * @param {string} currentVerse - current verse
 * @return {array} location to place verse content
 */
export const getSaveToLocation = (chapters, currentChapter, currentVerse) => {
  if (!currentVerse) {
    currentVerse = 'front';
  }
  if (!chapters[currentChapter][currentVerse])
    chapters[currentChapter][currentVerse] = [];

  return chapters[currentChapter][currentVerse];
};

/**
 * @description - create a USFM object with fields passed
 * @param {string} tag - string to use for tag
 * @param {string} number - optional number attribute
 * @param {string} content - optional content (may be saved as content or text depending on tag)
 * @return {{tag: *}} USFM object
 */
export const createUsfmObject = (tag, number, content) => {
  const output = { };
  let contentAttr;
  if (tag) {
    output.tag = tag;
    if (USFM.MARKER_TYPE[tag]) {
      output.type = USFM.MARKER_TYPE[tag];
    }
    contentAttr = USFM.markContentAsText(tag) ? 'text' : 'content';
  } else { // default to text type
    contentAttr = output.type = "text";
  }
  if (number) {
    if (USFM.markerSupportsNumbers(tag)) {
      output.number = number;
    } else { // handle rare case that parser places part of content as number
      let newContent = number;
      if (content) {
        newContent += ' ' + content;
      }
      content = newContent;
    }
  }
  if (content) {
    output[contentAttr] = content;
  }
  return output;
};

/**
 * @description push usfm object to array, and concat strings of last array item is also string
 * @param {array} nested - points to object that contains nested content such as for '\f'
 * @param {array} saveTo - location to place verse content
 * @param {string} usfmObject - object that contains usfm marker, or could be raw text
 */
export const pushObject = (nested, saveTo, usfmObject) => {
  const isNestedMarker = nested.length > 0;
  if (isNestedMarker) { // if this marker is nested in another marker, then we need to add to content as string
    const last = nested.length - 1;
    const contentAttr = USFM.markContentAsText(usfmObject.tag) ? 'text' : 'content';
    let text = nested[last][contentAttr];
    if (typeof usfmObject === "string") {
      text += usfmObject;
    } else {
      text += '\\' + usfmObject.tag;
      if (usfmObject.text) {
        text += ' ' + usfmObject.text;
      } else if (usfmObject.content) {
        text += ' ' + usfmObject.content;
      }
    }
    nested[last][contentAttr] = text;
    return;
  }

  if (typeof usfmObject === "string") { // if raw text, convert to object
    usfmObject = createUsfmObject(null, null, usfmObject);
  }

  if (saveTo.length && (usfmObject.type === "text")) {
    // see if we can append to previous string
    const lastPos = saveTo.length - 1;
    let lastObject = saveTo[lastPos];
    if (lastObject.type === "text") {
      // see if we need to separate with space
      lastObject.text += usfmObject.text;
      return;
    }
  }
  saveTo.push(usfmObject);
};

/**
 * @description - rollback nested to endpoint for this tag
 * @param {array} saveTo - location to place verse content
 * @param {String} content - usfm marker content
 * @param {array} nested - points to object that contains nested content such as for '\f'
 * @param {array} chapters - holds all chapter content
 * @param {String} tag - usfm marker tag
 * @param {string} nextChar - next character after marker
 * @param {string} currentChapter - current chapter
 * @param {string} currentVerse - current verse
 */
export const unPopNestedMarker = (saveTo, content, nested, chapters, tag,
                                  nextChar, currentChapter, currentVerse) => {
  let extra = content.substr(1); // pull out data after end marker
  if (tag[tag.length - 1] === "*") {
    tag = tag.substr(0, tag.length - 1);
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
  if (nextChar) {
    pushObject(nested, saveTo, nextChar);
  }
};

/**
 * @description - save the usfm object to specified place and handle nested data
 * @param {array} saveTo - location to place verse content
 * @param {array} nested - points to object that contains nested content such as for '\f'
 * @param {String} tag - usfm marker tag
 * @param {object} usfmObject - object that contains usfm marker
 */
export const saveUsfmObject = (saveTo, nested, tag, usfmObject) => {
  const isNestedMarker = nested.length > 0;
  if (isNestedMarker) {
    pushObject(nested, saveTo, usfmObject);
  } else { // not nested
    saveTo.push(usfmObject);
    if (USFM.markerRequiresTermination(tag)) { // need to handle nested data
      nested.push(usfmObject);
    }
  }
};

/**
 * @description normalize the numbers in string by removing leading '0'
 * @param {string} text - number string to normalize
 * @return {string} normalized number string
 */
export const stripLeadingZeros = text => {
  while ((text.length > 1) && (text[0] === '0')) {
    text = text.substr(1);
  }
  return text;
};

/**
 * @description - adds usfm object to current verse and handles nested USFM objects
 * @param {array} nested - points to object that contains nested content such as for '\f'
 * @param {array} chapters - holds all chapter content
 * @param {string} currentChapter - current chapter
 * @param {string} currentVerse - current verse
 * @param {object} usfmObject - object that contains usfm marker
 * @param {String} tag - usfm marker tag
 */
export const addToCurrentVerse = (nested, chapters, currentChapter,
                                  currentVerse, usfmObject, tag = null) => {
  let saveTo = getSaveToLocation(chapters, currentChapter, currentVerse);
  tag = tag || usfmObject.tag;
  if (!tag) {
    pushObject(nested, saveTo, usfmObject);
    return;
  }

  let content = usfmObject.content || "";
  const isEndMarker = (content && (content[0] === "*")) ||
    (tag[tag.length - 1] === "*");
  if (isEndMarker) { // check for end marker
    unPopNestedMarker(saveTo, content, nested, chapters, tag,
      usfmObject.nextChar, currentChapter, currentVerse);
  } else {
    if (usfmObject.nextChar && !usfmObject.close) {
      content += usfmObject.nextChar;
    }
    const output = createUsfmObject(tag, null, content);
    saveUsfmObject(saveTo, nested, tag, output);
  }
};

/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
export const usfmToJSON = (usfm, params = {}) => {
  USFM.init();
  const verseSpanRegex = /(-\d+\s)/;
  let lines = usfm.split(/\r?\n/); // get all the lines
  if (lines.length && (lines[lines.length - 1] === "")) {
    lines = lines.slice(0, lines.length - 1);
  }
  let usfmJSON = {};
  let markers = [];
  for (let line of lines) {
    const parsedLine = parseLine(line);
    markers = markers.concat(parsedLine);
  }
  let currentChapter = 0;
  let currentVerse = 0;
  let chapters = {};
  let verses = {};
  let headers = [];
  let nested = [];
  let onSameChapter = false;
  markers.forEach(function(marker) {
    switch (marker.tag) {
      case 'c': { // chapter
        nested = [];
        currentChapter = stripLeadingZeros(marker.number);
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
        currentVerse = stripLeadingZeros(marker.number);

        // check for verse span
        const spanMatch = verseSpanRegex.exec(marker.content);
        if (spanMatch) {
          currentVerse += spanMatch[0][0] +
            stripLeadingZeros(spanMatch[0].substr(1).trim());
          marker.content = marker.content.substr(spanMatch[0].length);
        }

        if (params.chunk === true && !onSameChapter) {
          if (verses[currentVerse]) {
            onSameChapter = true;
            break;
          } else {
            verses[currentVerse] = [];
            pushObject(nested, verses[currentVerse], marker.content);
          }
        }
        if (chapters[currentChapter] && !onSameChapter) {
          // if the current chapter exists, not on same chapter, and there is content to store
          if (chapters[currentChapter][currentVerse]) {
            // If the verse already exists, then we are flagging as 'on the same chapter'
            onSameChapter = true;
            break;
          }
          let saveTo = getSaveToLocation(chapters, currentChapter,
            currentVerse);
          pushObject(nested, saveTo, marker.content);
        }
        break;
      }
      case 'w': { // word
        const isNestedMarker = nested.length > 0;
        let saveTo = getSaveToLocation(chapters, currentChapter, currentVerse);
        if (isNestedMarker) {
          const wordObject = {
            tag: 'w',
            content: marker.content
          };
          pushObject(nested, saveTo, wordObject);
        } else { // not nested
          const wordObject = parseWord(marker.content);
          pushObject(nested, saveTo, wordObject);
        }
        if (marker.nextChar) {
          pushObject(nested, saveTo, marker.nextChar);
        }
        break;
      }
      case 'w*': {
        if (marker.nextChar) {
          let saveTo = getSaveToLocation(chapters, currentChapter,
            currentVerse);
          pushObject(nested, saveTo, marker.nextChar);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (currentChapter > 0 && marker.content) {
          addToCurrentVerse(nested, chapters, currentChapter, currentVerse,
            marker.content);
        } else if (currentChapter === 0 && !currentVerse) { // if we haven't seen chapter yet, its a header
          pushObject(nested, headers, createUsfmObject(marker.tag,
            marker.number, marker.content));
        }
        if (params.chunk && currentVerse > 0 && marker.content) {
          if (!verses[currentVerse])
            verses[currentVerse] = [];
          pushObject(nested, verses[currentVerse], marker.content);
        }
        break;
      }
      default: {
        if (currentChapter === 0 && !currentVerse) { // if we haven't seen chapter yet, its a header
          pushObject(nested, headers, createUsfmObject(marker.tag,
            marker.number, marker.content));
        } else if (currentChapter) {
          addToCurrentVerse(nested, chapters, currentChapter, currentVerse,
            marker);
        }
      }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  if (Object.keys(verses).length > 0) usfmJSON.verses = verses;
  return usfmJSON;
};
