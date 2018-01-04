import * as USFM from './USFM';

const VERSE_SPAN_REGEX = /(^-\d+\s)/;
const NUMBER = /(\d+)/;

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
 * @description - trim a leading space
 * @param {String} text - text to trim
 * @return {String} trimmed string
 */
export const removeLeadingSpace = text => {
  if (text && (text.length > 1) && (text[0] === " ")) {
    text = text.substr(1);
  }
  return text;
};

/**
 * @description - Parses the word marker into JSON
 * @param {String} wordContent - the string to find the data/attributes
 * @return {Object} - json object of the word attributes
*/
export const parseWord = wordContent => {
  let object = {};
  const wordParts = wordContent.split('|');
  const word = removeLeadingSpace(wordParts[0]);
  const attributeContent = wordParts[1];
  object = {
    text: word,
    tag: 'w',
    type: 'word'
  };
  if (attributeContent) {
    const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
    const matches = exports.getMatches(attributeContent, regex);
    matches.forEach(function(match) {
      let key = match[1];
      if (key === "strongs") { // fix invalid 'strongs' key
        key = "strong";
      }
      object[key] = match[2];
    });
  }
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
 * @description create marker object from text
 * @param {String} text - text to put in marker
 * @return {object} new marker
 */
export const createMarkerFromText = text => {
  return {
    open: text,
    tag: text
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

      const whiteSpaceInOpen = (open !== match[2]);
      if (whiteSpaceInOpen && !marker.number) {
        const shouldMatch = '\\' + open + (content ? ' ' + content : "");
        if ((removeLeadingSpace(match[0]) !== shouldMatch)) { // look for dropped inside white space
          const endPos = match.index + match[0].length;
          const lineLength = line.length;
          const runToEnd = endPos >= lineLength;
          if (runToEnd) {
            object.content = match[2].substr(open.length) + (content || "");
          }
        }
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
        object = createMarkerFromText(closeTag);
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
 * @param {object} state - holds parsing state information
 * @return {array} location to place verse content
 */
export const getSaveToLocation = state => {
  if (state.chunk) {
    if (!state.verses[state.currentVerse]) {
      state.verses[state.currentVerse] = [];
    }
    return state.verses[state.currentVerse];
  }

  if (!state.currentVerse) {
    state.currentVerse = 'front';
  }
  if (!state.chapters[state.currentChapter][state.currentVerse])
    state.chapters[state.currentChapter][state.currentVerse] = [];

  return state.chapters[state.currentChapter][state.currentVerse];
};

/**
 * @description - create a USFM object with fields passed
 * @param {string|null} tag - string to use for tag
 * @param {string|null} number - optional number attribute
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
 * @param {object} state - holds parsing state information
 * @param {array} saveTo - location to place verse content
 * @param {object|string} usfmObject - object that contains usfm marker, or could be raw text
 */
export const pushObject = (state, saveTo, usfmObject) => {
  if (!Array.isArray(saveTo)) {
    const isPhrase = Array.isArray(state.phrase);
    if (isPhrase) {
      saveTo = state.phrase;
    } else {
      const isNestedMarker = state.nested.length > 0;
      if (isNestedMarker) { // if this marker is nested in another marker, then we need to add to content as string
        const last = state.nested.length - 1;
        const contentAttr = USFM.markContentAsText(usfmObject.tag) ? 'text' : 'content';
        const lastObject = state.nested[last];
        let output = lastObject[contentAttr];
        if (typeof usfmObject === "string") {
          output += usfmObject;
        } else {
          output += '\\' + usfmObject.tag;
          const content = usfmObject.text || usfmObject.content;
          if (content) {
            if (content[0] !== ' ') {
              output += ' ';
            }
            output += content;
          }
        }
        lastObject[contentAttr] = output;
        return;
      }
    }
  }

  if (typeof usfmObject === "string") { // if raw text, convert to object
    usfmObject = createUsfmObject(null, null, usfmObject);
  }

  saveTo = Array.isArray(saveTo) ? saveTo : getSaveToLocation(state);
  if (saveTo.length && (usfmObject.type === "text")) {
    // see if we can append to previous string
    const lastPos = saveTo.length - 1;
    let lastObject = saveTo[lastPos];
    if (lastObject.type === "text") {
      lastObject.text += usfmObject.text;
      return;
    }
  }
  saveTo.push(usfmObject);
};

/**
 * @description - rollback nested to endpoint for this tag
 * @param {object} state - holds parsing state information
 * @param {String} content - usfm marker content
 * @param {String} tag - usfm marker tag
 * @param {string} nextChar - next character after marker
 */
export const unPopNestedMarker = (state, content, tag, nextChar) => {
  let extra = content.substr(1); // pull out data after end marker
  if (tag[tag.length - 1] === "*") {
    tag = tag.substr(0, tag.length - 1);
  }
  let found = false;
  for (let j = state.nested.length - 1; j >= 0; j--) {
    const stackTYpe = state.nested[j].tag;
    if (tag === stackTYpe) {
      while (state.nested.length > j) { // rollback nested to this point
        state.nested.pop();
      }
      found = true;
      break;
    }
  }
  if (!found) { // since nested and not in stack, add end marker to text content
    pushObject(state, null, '\\' + tag + '*');
  }
  if (extra) {
    pushObject(state, null, extra);
  }
  if (nextChar) {
    pushObject(state, null, nextChar);
  }
};

/**
 * @description - save the usfm object to specified place and handle nested data
 * @param {object} state - holds parsing state information
 * @param {String} tag - usfm marker tag
 * @param {object} usfmObject - object that contains usfm marker
 */
export const saveUsfmObject = (state, tag, usfmObject) => {
  const isNestedMarker = state.nested.length > 0;
  if (isNestedMarker) {
    pushObject(state, null, usfmObject);
  } else { // not nested
    const saveTo = getSaveToLocation(state);
    saveTo.push(usfmObject);
    if (USFM.markerRequiresTermination(tag)) { // need to handle nested data
      state.nested.push(usfmObject);
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
 * @param {object} state - holds parsing state information
 * @param {object} usfmObject - object that contains usfm marker
 * @param {String} tag - usfm marker tag
 */
export const addToCurrentVerse = (state, usfmObject, tag = null) => {
  tag = tag || usfmObject.tag;
  if (!tag) {
    pushObject(state, null, usfmObject);
    return;
  }

  let content = usfmObject.content || "";
  const isEndMarker = (content && (content[0] === "*")) ||
    (tag[tag.length - 1] === "*");
  if (isEndMarker) { // check for end marker
    unPopNestedMarker(state, content, tag, usfmObject.nextChar);
  } else {
    if (usfmObject.nextChar && !usfmObject.close) {
      content += usfmObject.nextChar;
    }
    const output = createUsfmObject(tag, null, content);
    saveUsfmObject(state, tag, output);
  }
};

/**
 * @description - process marker as a verse
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
export const parseAsVerse = (state, marker) => {
  state.nested = [];
  marker.content = marker.content || "";
  if (marker.nextChar === "\n") {
    marker.content += marker.nextChar;
  }
  state.currentVerse = stripLeadingZeros(marker.number);

  // check for verse span
  const spanMatch = VERSE_SPAN_REGEX.exec(marker.content);
  if (spanMatch) {
    state.currentVerse += spanMatch[0][0] +
      stripLeadingZeros(spanMatch[0].substr(1).trim());
    marker.content = marker.content.substr(spanMatch[0].length);
  }

  if (state.chunk && !state.onSameChapter) {
    if (state.verses[state.currentVerse]) {
      state.onSameChapter = true;
    } else {
      state.verses[state.currentVerse] = [];
      pushObject(state, null, marker.content);
    }
  } else if (state.chapters[state.currentChapter] && !state.onSameChapter) {
    // if the current chapter exists, not on same chapter, and there is content to store
    if (state.chapters[state.currentChapter][state.currentVerse]) {
      // If the verse already exists, then we are flagging as 'on the same chapter'
      state.onSameChapter = true;
    } else {
      pushObject(state, null, marker.content);
    }
  }
};

/**
 * @description - process marker as text
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
export const processAsText = (state, marker) => {
  if (state.currentChapter > 0 && marker.content) {
    addToCurrentVerse(state, marker.content);
  } else if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter yet, its a header
    pushObject(state, state.headers, createUsfmObject(marker.tag,
          marker.number, marker.content));
  }
  if (state.chunk && state.currentVerse > 0 && marker.content) {
    if (!state.verses[state.currentVerse])
      state.verses[state.currentVerse] = [];
    pushObject(state, state.verses[state.currentVerse], marker.content);
  }
};

/**
 * @description - convert marker to text
 * @param {object} marker - object to convert to text
 * @return {string} text representation of marker
 */
export const markerToText = marker => {
  let text = '\\' + marker.tag;
  if (marker.number) {
    text += " " + marker.number;
  }
  text += (marker.content ? " " + marker.content : "");
  if (marker.nextChar) {
    text += marker.nextChar;
  }
  return text;
};

/**
 * @description - process marker as a chapter
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
export const processAsChapter = (state, marker) => {
  state.nested = [];
  state.currentChapter = stripLeadingZeros(marker.number);
  state.chapters[state.currentChapter] = {};
  // resetting 'on same chapter' flag
  state.onSameChapter = false;
  state.currentVerse = 0;
};

/**
 * @description - see if verse number in content
 * @param {object} marker - marker object containing content
 */
export const extractNumberFromContent = marker => {
  const numberMatch = NUMBER.exec(marker.content);
  if (numberMatch) {
    marker.number = numberMatch[0];
    marker.content = marker.content.substr(numberMatch.length);
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
  const state = {
    currentChapter: 0,
    currentVerse: 0,
    chapters: {},
    verses: {},
    headers: [],
    nested: [],
    phrase: null,
    onSameChapter: false,
    chunk: (params.chunk === true)
  };
  for (let i = 0; i < markers.length; i++) {
    let marker = markers[i];
    switch (marker.tag) {
      case 'c': { // chapter
        if (!marker.number && marker.content) { // if no number, try to find in content
          extractNumberFromContent(marker);
        }
        if (marker.number) {
          processAsChapter(state, marker);
        } else { // no chapter number, add as text
          marker.content = markerToText(marker);
          processAsText(state, marker);
        }
        break;
      }
      case 'v': { // verse
        if (!marker.number && marker.content) { // if no number, try to find in content
          extractNumberFromContent(marker);
        }
        if (marker.number) {
          parseAsVerse(state, marker);
        } else { // no verse number, add as text
          marker.content = markerToText(marker);
          processAsText(state, marker);
        }
        break;
      }
      case 'k': { // keyphrase
        const wordObject = parseWord(marker.content);
        wordObject.type = "keyterm";
        const milestone = wordObject.text.trim();
        if (milestone === '-s') { // milestone start
          let saveTo = getSaveToLocation(state);
          wordObject.tag = "k" + milestone;
          delete wordObject.text;
          state.phrase = [];
          wordObject.children = state.phrase;
          pushObject(state, saveTo, wordObject);
        } else if (milestone === '-e') { // milestone end
          state.phrase = null; // stop adding to phrase
          if ((i + 1 < markers.length) && markers[i + 1].content &&
            (markers[i + 1].content.substr(0, 2) === "\\*")) { // check if next marker is part of milestone end
            let nextContentTrimmed = markers[i + 1].content.substr(2); // remove phrase end marker
            if (nextContentTrimmed) {
              markers[i + 1].content = nextContentTrimmed;
            } else { // no text after end marker
              i++; // skip following text
            }
          }
        }
        break;
      }
      case 'w': { // word
        const wordObject = parseWord(marker.content);
        pushObject(state, null, wordObject);
        if (marker.nextChar) {
          pushObject(state, null, marker.nextChar);
        }
        break;
      }
      case 'w*': {
        if (marker.nextChar) {
          pushObject(state, null, marker.nextChar);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        processAsText(state, marker);
        break;
      }
      default: {
        const tag0 = marker.tag ? marker.tag.substr(0, 1) : "";
        if ((tag0 === 'v') || (tag0 === 'c')) { // check for mangled verses and chapters
          const number = marker.tag.substr(1);
          const isInt = /^\+?\d+$/.test(number);
          if (isInt) {
            // separate number from tag
            marker.tag = tag0;
            if (marker.number) {
              marker.content = marker.number +
                (marker.content ? " " + marker.content : "");
            }
            marker.number = number;
            if (tag0 === 'v') {
              parseAsVerse(state, marker);
              marker = null;
            } else if (tag0 === 'c') {
              processAsChapter(state, marker);
              marker = null;
            }
          } else if (marker.tag.length === 1) { // convert line to text
            marker.content = markerToText(marker);
            processAsText(state, marker);
            marker = null;
          }
        }
        if (marker) { // if not yet processed
          if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter yet, its a header
            pushObject(state, state.headers, createUsfmObject(marker.tag,
              marker.number, marker.content));
          } else if (state.currentChapter) {
            addToCurrentVerse(state, marker);
          }
        }
      }
    }
  }
  usfmJSON.headers = state.headers;
  usfmJSON.chapters = state.chapters;
  if (Object.keys(state.verses).length > 0) usfmJSON.verses = state.verses;
  return usfmJSON;
};
