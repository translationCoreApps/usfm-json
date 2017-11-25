import * as USFM from './USFM'

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
      let next_char = null;
      const endPos = match.index + match[0].length;
      if(endPos >= string.length) {
        next_char = "\n"; // save new line
      } else {
        let char = string[endPos];
        if(char === ' ') {
          next_char = char; // save space
        }
      }
      if(next_char) {
        match['next_char'] = next_char;
      }
      matches.push(match);
    }
  }
  return matches;
};

/**
 * @description - Parses the marker that opens and describes content
 * @param {String} markerOpen - the string that contains the marker '\v 1', '\p', ...
 * @return {Object} - the object of type and number if it exists
*/
export const parseMarkerOpen = markerOpen => {
  let object = {};
  if (markerOpen) {
    const regex = /(\w+)\s*(\d*)/g;
    const matches = exports.getMatches(markerOpen, regex);
    object = {
      type: matches[0][1],
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
    type: 'w'
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
        type: marker.type,
        number: marker.number,
        content: content,
        close: close
      };
      if(match.next_char) {
        object['next_char'] = match.next_char;
      }
      array.push(object);
    });
    // check for leftover text at end of line
    if(matches.length) {
      const lastMatch = matches[matches.length - 1];
      const endPos = lastMatch.index + lastMatch[0].length;
      if(endPos < line.length) {
        const object = {
          content: line.substr(endPos)
        };
        array.push(object);
      }
    }
  } else { // doesn't have a marker but may have content
    // this is considered an orphaned line
    const orphan = line.trim();
    const object = {
      content: orphan
    };
    array.push(object);
  }
  return array;
};

/**
 * @description - find place to store USFM marker.  If marker is nested inside another marker, then marker will be
 *                  append to that marker (top of stack), otherwise it will be added to current chapter/verse
 * @param stack
 * @param chapters
 * @param currentChapter
 * @param currentVerse
 * @return {*}
 */
function getSaveToLocation(stack, chapters, currentChapter, currentVerse) {
  if (stack.length) { // if tag is nested, return current position
    return stack[stack.length - 1].content;
  } else {
    if (!chapters[currentChapter][currentVerse])
      chapters[currentChapter][currentVerse] = [];

    return chapters[currentChapter][currentVerse];
  }
}

/**
 * @description - rollback stack to endpoint for this marker type
 * @param saveTo
 * @param content
 * @param stack
 * @param chapters
 * @param type
 * @param currentChapter
 * @param currentVerse
 */
function unPopNestedMarker(saveTo, content, stack, chapters, type, currentChapter, currentVerse) {
  let extra = content.substr(1); // pull out data after end marker
  if(extra && extra[0] === " ") {
    extra = extra.substr(1);
  }
  if(type[type.length-1] == "*") {
    type = type.substr(0,type.length-1);
  }
  for (let j = stack.length - 1; j >= 0; j--) {
    const stackTYpe = stack[j].type;
    if (type === stackTYpe) {
      while (stack.length > j) { // rollback stack to this point
        stack.pop();
      }
      saveTo = getSaveToLocation(stack, chapters, currentChapter, currentVerse); // update where to put output
      break;
    }
  }
  if (extra) {
    pushObject(saveTo, extra)
  }
}

/**
 * @description - check if object has close, if so then process it
 * @param saveTo
 * @param content
 * @param stack
 * @param chapters
 * @param usfmObject
 * @param currentChapter
 * @param currentVerse
 */
function processClose(saveTo, content, stack, chapters, usfmObject, currentChapter, currentVerse) {
  const close = usfmObject["close"];
  if(close && close.length && (close[0] === "\\")) {
    unPopNestedMarker(saveTo, "", stack, chapters, close.substr(1), currentChapter, currentVerse);
  }
}

/**
 * @description - save the usfm object to specified place and handle nested data
 * @param saveTo
 * @param content
 * @param stack
 * @param type
 * @param usfmObject
 */
function saveUsfmObject(saveTo, content, stack, type, usfmObject) {
  const markerRequiresTermination = USFM.bsearch(USFM.NEED_TERMINATION_MARKERS,type) >= 0;
  saveTo.push(usfmObject);
  if (markerRequiresTermination) { // need to handle nested data
    stack.push(usfmObject);
    const new_content = [];
    usfmObject["content"] = new_content;
    if (content) {
      new_content.push(content);
    }
  } else {
    if (content) {
      usfmObject["content"] = content;
    }
  }
}

/**
 * @description - adds usfm object to current verse and handles nested USFM objects
 * @param stack
 * @param chapters
 * @param currentChapter
 * @param currentVerse
 * @param usfmObject
 * @param type
 */
function addToCurrentVerse(stack, chapters, currentChapter, currentVerse, usfmObject, type=null) {
  let saveTo = getSaveToLocation(stack, chapters, currentChapter, currentVerse);
  type = type || usfmObject["type"];
  if(!type) {
    pushObject(saveTo, usfmObject);
    return;
  }

  let content = usfmObject["content"];
  const markerHasNoContent = USFM.bsearch(USFM.NO_CONTENT_MARKERS,type) >= 0;
  if(markerHasNoContent) {
    // separate marker and text
    const output = {
      type: type,
    };
    if(content) {
      output["content"] = content;
    }
    saveTo.push(output);
    if(content) {
      pushObject(saveTo, content);
    }
  } else {
    const output = {
      type: type
    };
    if (usfmObject["number"]) {
      output["number"] = usfmObject["number"];
    }

    const isEndMarker = (content && (content[0]==="*"));
    if(isEndMarker) { // check for end marker
      unPopNestedMarker(saveTo, content, stack, chapters, type, currentChapter, currentVerse);
    } else {
      saveUsfmObject(saveTo, content, stack, type, output);
    }
  }
  processClose(saveTo, content, stack, chapters, usfmObject, currentChapter, currentVerse);
}

/**
 * @description push text string to array, and concat strings of last array item is also string
 * @param saveTo
 * @param wordObject
 */
function pushObject(saveTo, wordObject) {
  if(saveTo.length && (typeof wordObject === "string")) {
    // see if we can append to previous string
    const lastPos = saveTo.length-1;
    let lastObject = saveTo[lastPos];
    if(typeof lastObject === "string") {
      // see if we need to combine with new line
      if(wordObject && wordObject[0] !== '\n') {
        lastObject += '\n';
      }
      lastObject += wordObject;
      saveTo[lastPos] = lastObject;
      return;
    }
  }
  saveTo.push(wordObject);
}

/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
export const usfmToJSON = (usfm, params = {}) => {
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
  let stack = [];
  let onSameChapter = false;
  markers.forEach(function(marker) {
    switch (marker.type) {
      case 'c': { // chapter
        stack = [];
        currentChapter = marker.number;
        chapters[currentChapter] = {};
        // resetting 'on same chapter' flag
        onSameChapter = false;
        currentVerse = 0;
        break;
      }
      case 'v': { // verse
        stack = [];
        marker.content = marker.content || "";
        currentVerse = marker.number;
        if (params.chunk === true && (marker.content || marker.content === "") && !onSameChapter) {
          if (verses[currentVerse]) {
            onSameChapter = true;
            break;
          } else {
            verses[currentVerse] = [];
            verses[currentVerse].push(marker.content);
          }
        }
        if (chapters[currentChapter] && marker.content && !onSameChapter) {
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
        const wordObject = exports.parseWord(marker.content);
        let saveTo = getSaveToLocation(stack, chapters, currentChapter, currentVerse);
        pushObject(saveTo, wordObject);
        if(marker.next_char) {
          pushObject(saveTo, marker.next_char);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (currentChapter > 0 && currentVerse > 0 && marker.content) {
          addToCurrentVerse(stack, chapters, currentChapter, currentVerse, marker.content);
        }
        if (params.chunk && currentVerse > 0 && marker.content) {
          if (!verses[currentVerse])
            verses[currentVerse] = [];
          pushObject(verses[currentVerse],marker.content);
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
          headers[marker.type] = value;
        }
        else if(currentChapter && currentVerse) {
          addToCurrentVerse(stack, chapters, currentChapter, currentVerse, marker);
        }
      }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  if (Object.keys(verses).length > 0) usfmJSON.verses = verses;
  return usfmJSON;
};
