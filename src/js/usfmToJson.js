/* eslint-disable no-use-before-define,no-negated-condition,brace-style */
/**
 * @description for converting from USFM to json format.  Main method is usfmToJSON()
 */

import * as USFM from './USFM';

const VERSE_SPAN_REGEX = /(^-\d+\s)/;
const NUMBER = /(\d+)/;

/**
 * @description - Finds all of the regex matches in a string
 * @param {String} string - the string to find matches in
 * @param {RegExp} regex - the RegExp to find matches with, must use global flag /.../g
 * @param {Boolean} lastLine - true if last line of file
 * @return {Array} - array of results
*/
const getMatches = (string, regex, lastLine) => {
  let matches = [];
  let match;
  if (string.match(regex)) { // check so you don't get caught in a loop
    while ((match = regex.exec(string))) {
      // preserve white space
      let nextChar = null;
      const endPos = match.index + match[0].length;
      if (!lastLine && (endPos >= string.length)) {
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
const parseMarkerOpen = markerOpen => {
  let object = {};
  if (markerOpen) {
    const regex = /(\+?\w+)\s*(\d*)/g;
    const matches = getMatches(markerOpen, regex, true);
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
const removeLeadingSpace = text => {
  if (text && (text.length > 1) && (text[0] === " ")) {
    text = text.substr(1);
  }
  return text;
};

/**
 * @description - Parses the word marker into word object
 * @param {object} state - holds parsing state information
 * @param {String} wordContent - the string to find the data/attributes
 * @return {Object} - object of the word attributes
*/
const parseWord = (state, wordContent) => {
  let object = {};
  const wordParts = (wordContent || "").split('|');
  const word = wordParts[0].trim();
  const attributeContent = wordParts[1];
  object = {
    text: word,
    tag: 'w',
    type: 'word'
  };
  if (state.params["content-source"]) {
    object["content-source"] = state.params["content-source"];
  }
  if (attributeContent) {
    const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
    const matches = getMatches(attributeContent, regex, true);
    matches.forEach(function(match) {
      let key = match[1];
      if (key === "strongs") { // fix invalid 'strongs' key
        key = "strong";
      }
      if (state.params.map && state.params.map[key]) { // see if we should convert this key
        key = state.params.map[key];
      }
      let value = match[2];
      if (state.params.convertToInt &&
        (state.params.convertToInt.includes(key))) {
        value = parseInt(value, 10);
      }
      object[key] = value;
    });
  }
  return object;
};

/**
 * @description - make a marker object that contains the text
 * @param {string} text - text to embed in object
 * @return {{content: *}} new text marker
 */
const makeTextMarker = text => {
  return {
    content: text
  };
};

/**
 * @description create marker object from text
 * @param {String} text - text to put in marker
 * @return {object} new marker
 */
const createMarkerFromText = text => {
  return {
    open: text,
    tag: text
  };
};

/**
 * @description - Parses the line and determines what content is in it
 * @param {String} line - the string to find the markers and content
 * @param {Boolean} lastLine - true if last line of file
 * @return {Array} - array of objects that describe open/close and content
*/
const parseLine = (line, lastLine) => {
  let array = [];
  if (line.trim() === '') {
    if (!lastLine) {
      const object = makeTextMarker(line + '\n');
      array.push(object);
    }
    return array;
  }
  const regex = /([^\\]+)?\\(\+?\w+\s*\d*)(?!\w)\s*([^\\]+)?(\\\w\*)?/g;
  const matches = getMatches(line, regex, lastLine);
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
    const object = makeTextMarker(line + (lastLine ? '' : '\n'));
    array.push(object);
  }
  return array;
};

/**
 * get top phrase if doing phrase (milestone)
 * @param {object} state - holds parsing state information
 * @return {object} location to add to phrase or null
 */
const getLastPhrase = state => {
  if (state.phrase && (state.phrase.length > 0)) {
    return state.phrase[state.phrase.length - 1];
  }
  return null;
};

/**
 * @description - get location for chapter/verse, if location doesn't exist, create it.
 * @param {object} state - holds parsing state information
 * @return {array} location to place verse content
 */
const getSaveToLocation = state => {
  let saveTo = state.headers;
  const phrase = getLastPhrase(state);
  if (phrase !== null) {
    saveTo = phrase;
  }
  else if (state.params.chunk) {
    if (state.currentVerse) {
      if (!state.verses[state.currentVerse]) {
        state.verses[state.currentVerse] = [];
      }
      saveTo = state.verses[state.currentVerse];
    }
  }
  else if (state.currentChapter) {
    if (!state.currentVerse) {
      state.currentVerse = 'front';
    }
    if (!state.chapters[state.currentChapter][state.currentVerse])
      state.chapters[state.currentChapter][state.currentVerse] = [];

    saveTo = state.chapters[state.currentChapter][state.currentVerse];
  }
  return saveTo;
};

/**
 * @description - create a USFM object from marker
 * @param {object} marker - object that contains usfm marker
 * @param {boolean} noNext - if true, then ignore nextChar
 * @return {{tag: *}} USFM object
 */
export const createUsfmObject = (marker, noNext = false) => {
  if (typeof marker === 'string') {
    return ({
      type: "text",
      text: marker
    });
  }
  const output = marker;
  const tag = marker.tag;
  let content = marker.content || marker.text;
  const tagProps = USFM.USFM_PROPERTIES[tag];
  const type = USFM.getMarkerType(tagProps);
  let isText = true;
  if (tag) {
    isText = USFM.propDisplayable(tagProps);
    if (type) {
      output.type = type;
    }
  } else { // default to text type
    output.type = "text";
  }
  if (marker.number) {
    if (!USFM.markerSupportsNumbers(tag)) {
      // handle rare case that parser places part of content as number
      let newContent = marker.number;
      if (content) {
        newContent += ' ' + content;
      }
      content = newContent;
      delete output.number;
    }
  } else {
    delete output.number;
  }
  if (noNext) {
    delete output.nextChar;
  }
  else if (marker.nextChar) {
    if (content) {
      content += marker.nextChar;
      delete output.nextChar;
    }
  } else if (!content && (type === 'paragraph') && (!marker.nextChar)) {
    output.nextChar = ' ';
  }
  delete output.content;
  delete output.text;
  if (content) {
    output[isText ? 'text' : 'content'] = content;
  }
  delete output.open;
  delete output.close;
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
    const phrase = getLastPhrase(state);
    if (phrase === null) {
      const isNestedMarker = state.nested.length > 0;
      if (isNestedMarker) { // if this marker is nested in another marker, then we need to add to content as string
        const last = state.nested.length - 1;
        const contentAttr = USFM.markerContentDisplayable(usfmObject.tag) ? 'text' : 'content';
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
    } else {
      saveTo = phrase;
    }
  }

  if (typeof usfmObject === "string") { // if raw text, convert to object
    if (usfmObject === '') { // skip empty strings
      return;
    }
    usfmObject = createUsfmObject(usfmObject);
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
 * @description test if last character was newline (or return) char
 * @param {String} line - line to test
 * @return {boolean} true if newline
 */
const isLastCharNewLine = line => {
  const lastChar = (line) ? line.substr(line.length - 1) : '';
  const index = ['\n', '\r'].indexOf(lastChar);
  return index >= 0;
};

/**
 * @description test if next to last character is quote
 * @param {String} line - line to test
 * @return {boolean} true if newline
 */
const isNextToLastCharQuote = line => {
  const nextToLastChar = (line && (line.length >= 2)) ? line.substr(line.length - 2, 1) : '';
  const index = ['"', '“'].indexOf(nextToLastChar);
  return index >= 0;
};

/**
 * @description - remove previous new line from text
 * @param {object} state - holds parsing state information
 * @param {boolean} ignoreQuote - if true then don't remove last new line if preceded by quote.
 */
const removeLastNewLine = (state, ignoreQuote = false) => {
  const saveTo = getSaveToLocation(state);
  if (saveTo && saveTo.length) {
    const lastObject = saveTo[saveTo.length - 1];
    if (lastObject.type === 'text') {
      const text = lastObject.text;
      if (isLastCharNewLine((text))) {
        const removeNewLine = !ignoreQuote || !isNextToLastCharQuote(text);
        if (removeNewLine) {
          if (text.length === 1) {
            saveTo.pop();
          } else {
            lastObject.text = text.substr(0, text.length - 1);
          }
        }
      }
    }
  }
};

/**
 * @description normalize the numbers in string by removing leading '0'
 * @param {string} text - number string to normalize
 * @return {string} normalized number string
 */
const stripLeadingZeros = text => {
  while ((text.length > 1) && (text[0] === '0')) {
    text = text.substr(1);
  }
  return text;
};

/**
 * check if object is an end marker
 * @param {object} marker - object to check
 * @return {{endMarker: (null|string), spannedUsfm: (boolean)}} return new values
 */
const checkForEndMarker = marker => {
  let spannedUsfm = false;
  let endMarker = null;
  let content = marker.content || "";
  let initialTag = marker.tag;
  let baseTag = marker.tag;
  if (baseTag.substr(baseTag.length - 1) === "*") {
    baseTag = baseTag.substr(0, baseTag.length - 1);
    endMarker = marker.tag;
  }
  else if (content.substr(0, 1) === '-') {
    const nextChar = content.substr(1, 1);
    if ((nextChar === 's') || (nextChar === 'e')) {
      let trim = 2;
      if (content.substr(trim, 1) === ' ') {
        trim++;
      }
      marker.tag += content.substr(0, 2);
      endMarker = (nextChar === 'e') ? marker.tag : null;
      baseTag += '-s';
      content = content.substr(trim);
      marker.content = content;
    }
  }
  else if (content.substr(0, 1) === '*') {
    let trim = 1;
    let space = '';
    if (content.substr(trim, 1) === ' ') {
      trim++;
      space = ' ';
    }
    marker.tag += content.substr(0, 1);
    endMarker = marker.tag;
    content = content.substr(trim);
    if (content) {
      content += (marker.nextChar || '');
      delete marker.nextChar;
    }
    if (space) {
      if (content) {
        marker.endMarkerChar = space;
      } else {
        marker.nextChar = space;
      }
    }
    marker.content = content;
  }
  if (endMarker) {
    spannedUsfm = true;
  } else {
    const tagProps = USFM.USFM_PROPERTIES[baseTag];
    if (USFM.propStandalone(tagProps)) {
      endMarker = marker.tag;
      spannedUsfm = true;
    } else {
      let termination = USFM.propTermination(tagProps);
      if (termination) {
        spannedUsfm = true;
        if ((initialTag + termination === marker.tag)) {
          endMarker = marker.tag;
        }
      }
    }
  }
  return {endMarker, spannedUsfm};
};

/**
 * @description - save the usfm object to specified place and handle nested data
 * @param {object} state - holds parsing state information
 * @param {String} tag - usfm marker tag
 * @param {object} marker - object that contains usfm marker
 */
const saveUsfmObject = (state, tag, marker) => {
  const phraseParent = getPhraseParent(state);
  if (phraseParent) {
    if (!USFM.markerContentDisplayable(phraseParent.tag)) {
      const objectText = (typeof marker === 'string') ? marker : markerToText(marker);
      phraseParent.content = (phraseParent.content || "") + objectText;
    }
    else {
      const saveTo = getLastPhrase(state);
      const usfmObject_ = createUsfmObject(marker);
      saveTo.push(usfmObject_);
    }
  } else if (state.nested.length > 0) { // is nested object
    pushObject(state, null, marker);
  } else { // not nested
    const saveTo = getSaveToLocation(state);
    saveTo.push(marker);
  }
};

/**
 * keeps nesting count if of same type
 * @param {object} state - holds parsing state information
 * @param {object} phraseParent - object adding to
 * @param {string} tag - tag for verseObject
 * @return {boolean} true if match
 */
const incrementPhraseNesting = (state, phraseParent, tag) => {
  if (phraseParent && (phraseParent.tag === tag)) {
    if (!phraseParent.nesting) {
      phraseParent.nesting = 0;
    }
    phraseParent.nesting++;
    return true;
  }
  return false;
};

/**
 * keeps nesting count if of same type
 * @param {object} state - holds parsing state information
 * @param {object} phraseParent - object adding to
 * @param {string} endTag - tag for verseObject
 * @return {{matchesParent: (boolean), count: (number)}} return new values
 */
const decrementPhraseNesting = (state, phraseParent, endTag) => {
  let matchesParent = false;
  let count = -1;
  if (phraseParent) {
    let termination = USFM.markerTermination(phraseParent.tag);
    if (termination) {
      matchesParent = (termination === endTag) ||
        (phraseParent.tag + termination === endTag) ||
        // compare USFM3 milestones such as '\\qt-s' and '\\qt-e\\*`
        (phraseParent.tag.substr(0, phraseParent.tag.length - 2) +
            termination + '\\*' === endTag);
    }
    if (!matchesParent &&
      (USFM.SPECIAL_END_TAGS[endTag] === phraseParent.tag)) {
      matchesParent = true;
    }
    if (matchesParent) {
      count = phraseParent.nesting || 0;
      if (count) {
        phraseParent.nesting = --count;
      }
      if (!count) {
        delete phraseParent.nesting;
      }
      delete phraseParent.usfm3Milestone;
    }
  }
  return {matchesParent, count};
};

/**
 * get the last item that was saved
 * @param {object} state - holds parsing state information
 * @return {Object} last item
 */
const getLastItem = state => {
  let last = getSaveToLocation(state);
  if (last && last.length) {
    last = last[last.length - 1];
  }
  return last;
};

/**
 * mark the beginning of a spanned usfm
 * @param {object} state - holds parsing state information
 * @param {object} marker - verseObject to save
 * @param {string} tag - tag for verseObject
 */
const startSpan = (state, marker, tag) => {
  marker.tag = tag;
  const phraseParent = getPhraseParent(state);
  const tagProps = USFM.USFM_PROPERTIES[tag];
  const displayable = USFM.propDisplayable(tagProps);
  if (USFM.propUsfm3Milestone(tagProps)) {
    marker.usfm3Milestone = true;
  }
  if (USFM.propAttributes(tagProps)) {
    const contentAttr = USFM.propDisplayable(tagProps) ? 'text' : 'content';
    let content = marker[contentAttr];
    if (content) {
      marker.attrib = content;
      const pos = content.indexOf('|');
      if (pos >= 0) {
        marker.attrib = content.substr(pos);
        content = content.substr(0, pos);
      } else {
        content = '';
      }
      if (content) {
        marker[contentAttr] = content;
      }
    }
    if (!content) {
      delete marker[contentAttr];
    }
  }
  if (phraseParent) {
    if (!USFM.markerContentDisplayable(phraseParent.tag)) {
      phraseParent.content = (phraseParent.content || "") + markerToText(marker);
      incrementPhraseNesting(state, phraseParent, tag);
      return;
    }
  }
  if (displayable) { // we need to nest
    pushObject(state, null, marker);
    if (state.phrase === null) {
      state.phrase = []; // create new phrase stack
      state.phraseParent = marker;
    }
    state.phrase.push([]); // push new empty list onto phrase stack
    marker.children = getLastPhrase(state); // point to top of phrase stack
  } else {
    saveUsfmObject(state, tag, marker);
    if (state.phrase === null) {
      let last = getLastItem(state);
      state.phrase = []; // create new phrase stack
      state.phrase.push([]); // push new empty list onto phrase stack
      state.phraseParent = last;
    }
    incrementPhraseNesting(state, marker, tag);
  }
};

/**
 * get parent of current phrase
 * @param {object} state - holds parsing state information
 * @return {Object} parent
 */
const getPhraseParent = state => {
  let parent = null;
  if ((state.phrase !== null) && (state.phrase.length > 1)) {
    parent = state.phrase[state.phrase.length - 2];
  }
  if (parent) {
    if (parent.length > 0) {
      parent = parent[parent.length - 1]; // get last in array
    } else {
      parent = null;
    }
  }
  if (!parent) {
    parent = state.phraseParent;
  }
  return parent;
};

/**
 * pop and return last phrase
 * @param {object} state - holds parsing state information
 * @return {object} last phrase
 */
const popPhrase = state => {
  let last = null;
  if (state.phrase && (state.phrase.length > 0)) {
    state.phrase.pop(); // remove last phrases
    if (state.phrase.length <= 0) {
      state.phrase = null; // stop adding to phrases
      last = state.phraseParent;
      state.phraseParent = null;
    } else {
      last = getPhraseParent(state);
    }
  } else {
    state.phraseParent = null;
  }
  return last;
};

/**
 * end a spanned usfm
 * @param {object} state - holds parsing state information
 * @param {number} index - current position in markers
 * @param {array} markers - parsed markers we are iterating through
 * @param {string} endMarker - end marker for phrase
 * @param {boolean} header - if true then saving to header
 * @return {number} new index
 */
const endSpan = (state, index, markers, endMarker, header = false) => {
  let current = markers[index];
  let content = current.content;
  let phraseParent = getPhraseParent(state);
  const phraseParentProps =
          phraseParent && USFM.USFM_PROPERTIES[phraseParent.tag] || null;
  const parentContentDisplayable = USFM.propDisplayable(phraseParentProps);
  if (endMarker && USFM.propUsfm3Milestone(phraseParentProps)) {
    endMarker += "\\*";
  }
  if (!phraseParent || parentContentDisplayable) {
    popPhrase(state);
    if (phraseParent && endMarker) {
      phraseParent.endTag = endMarker;
      if ((phraseParent.children !== undefined) &&
            !phraseParent.children.length) {
        delete phraseParent.children; // remove unneeded empty children
      }
    }
  }
  let checkNext = USFM.markerStandalone(current.tag);
  let trimLength = 0;
  if (content) {
    const next = content[0];
    if (['\\', '-', '*'].includes(next)) {
      if ((next === "*")) { // check if content is part of milestone end
        trimLength = 1;
      }
      else if ((content.substr(0, 2) === "\\*")) { // check if content is part of milestone end
        trimLength = 2;
      }
      else if ((content.substr(0, 4) === "-e\\*")) { // check if content marker is part of milestone end
        trimLength = 4;
      }
      else if ((content.substr(0, 3) === "-e*")) { // check if content marker is part of milestone end
        trimLength = 3;
      }
      else if ((content === "-e")) { // check if content + next marker is part of milestone end
        trimLength = 2;
        checkNext = true;
      }
      if (trimLength) {
        if (content.substr(trimLength, 1) === '\n') {
          trimLength++;
        }
        content = content.substr(trimLength); // remove phrase end marker
      }
    }
  }
  if (USFM.markerHasEndAttributes(current.tag)) {
    current.attrib = content;
    current.content = content = "";
  }
  let terminator = null;
  if (checkNext || (!content && !current.nextChar && endMarker)) {
    trimLength = 0;
    if ((index + 1) < markers.length) {
      const nextItem = markers[index + 1];
      if (!nextItem.tag) {
        let nextContent = nextItem.content || '';
        if ((nextContent.substr(0, 1) === "*")) { // check if content is part of milestone end
          trimLength = 1;
        }
        else if ((nextContent.substr(0, 2) === "\\*")) { // check if content is part of milestone end
          trimLength = 2;
        }
        terminator = nextContent.substr(0, trimLength);
        current.tag += terminator;
        const nextChar = nextContent.substr(trimLength, 1);
        if ((nextChar === ' ') || nextChar === '\n') {
          trimLength++;
          current.nextChar = nextChar;
        }
        if (trimLength) {
          content = '';
          nextContent = nextContent.substr(trimLength);
          nextItem.content = nextContent;
        }
        if (!nextContent) {
          index++;
        }
      }
    }
  }
  if (current && current.nextChar) {
    if (content) {
      content += current.nextChar;
      delete current.nextChar;
    }
  }
  if (phraseParent) {
    let endMarker_ = "\\" + endMarker;
    const {matchesParent, count} =
      decrementPhraseNesting(state, phraseParent, endMarker);
    const finishPhrase = matchesParent && (count <= 0);
    if (!parentContentDisplayable) {
      let nextChar = current && current.nextChar || '';
      if (content && nextChar) {
        content += nextChar;
        nextChar = '';
      }
      nextChar += (current && current.endMarkerChar) || '';
      if (!finishPhrase) {
        phraseParent.content = (phraseParent.content || "") +
            endMarker_ + nextChar;
      } else {
        phraseParent.endTag = endMarker;
        if (nextChar) {
          phraseParent.nextChar = nextChar;
        }
        popPhrase(state);
      }
    } else if (finishPhrase) { // parent displayable and this finishes
      phraseParent.endTag = endMarker;
      const nextChar = current && (current.nextChar || current.endMarkerChar);
      if (nextChar) {
        phraseParent.nextChar = nextChar;
      }
    }
  } else { // no parent, so will save end marker
    content = current;
  }
  if (content || !phraseParent) {
    saveUsfmObject(state, null, createUsfmObject(content, header));
  }
  return index;
};

/**
 * @description - adds usfm object to current verse and handles nested USFM objects
 * @param {object} state - holds parsing state information
 * @param {object} marker - object that contains usfm marker
 */
const addToCurrentVerse = (state, marker) => {
  let tag = marker.tag;
  if (!tag) {
    pushObject(state, null, createUsfmObject(marker));
    return;
  }
  saveUsfmObject(state, tag, createUsfmObject(marker));
};

/**
 * @description - process marker as a verse
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
const parseAsVerse = (state, marker) => {
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

  if (state.params.chunk && !state.onSameChapter) {
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
const processAsText = (state, marker) => {
  if (state.currentChapter > 0 && marker.content) {
    addToCurrentVerse(state, marker.content);
  } else if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter yet, its a header
    pushObject(state, state.headers, createUsfmObject(marker));
  }
  if (state.params.chunk && state.currentVerse > 0 && marker.content) {
    if (!state.verses[state.currentVerse])
      state.verses[state.currentVerse] = [];
    if (getPhraseParent(state)) {
      saveUsfmObject(state, null, marker.content);
    } else {
      pushObject(state, state.verses[state.currentVerse], marker.content);
    }
  }
};

const addTextField = text => {
  let results = "";
  if (text) {
    if (text.substr(0, 1) !== " ") {
      results += " ";
    }
    results += text;
  }
  return results;
};

/**
 * @description - convert marker to text
 * @param {object} marker - object to convert to text
 * @return {string} text representation of marker
 */
const markerToText = marker => {
  if (!marker.tag) {
    return marker.text || marker.content;
  }
  let text = '\\' + marker.tag;
  if (marker.number) {
    text += " " + marker.number;
  }
  const content = marker.content || marker.text;
  text += addTextField(content);
  if (marker.attrib) {
    text += (content ? '' : ' ') + marker.attrib;
  }
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
const processAsChapter = (state, marker) => {
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
const extractNumberFromContent = marker => {
  const numberMatch = NUMBER.exec(marker.content);
  if (numberMatch) {
    marker.number = numberMatch[0];
    marker.content = marker.content.substr(numberMatch.length);
  }
};

const getVerseObjectsForChapter = currentChapter => {
  const outputChapter = {};
  for (let verseNum of Object.keys(currentChapter)) {
    const verseObjects = currentChapter[verseNum];
    outputChapter[verseNum] = {
      verseObjects: verseObjects
    };
  }
  return outputChapter;
};

const getVerseObjectsForBook = (usfmJSON, state) => {
  usfmJSON.chapters = {};
  for (let chapterNum of Object.keys(state.chapters)) {
    const currentChapter = state.chapters[chapterNum];
    usfmJSON.chapters[chapterNum] = getVerseObjectsForChapter(currentChapter);
  }
};

/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing. Properties:
 *                    chunk {boolean} - if true then output is just a small piece of book
 *                    content-source {String} - content source attribute to add to word imports
 *                    convertToInt {Array} - attributes to convert to integer
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
export const usfmToJSON = (usfm, params = {}) => {
  let lines = usfm.split(/\r?\n/); // get all the lines
  let usfmJSON = {};
  let markers = [];
  let lastLine = lines.length - 1;
  for (let i = 0; i < lines.length; i++) {
    const parsedLine = parseLine(lines[i], i >= lastLine);
    markers.push.apply(markers, parsedLine);
  }
  const state = {
    currentChapter: 0,
    currentVerse: 0,
    chapters: {},
    verses: {},
    headers: [],
    nested: [],
    phrase: null,
    phraseParent: null,
    onSameChapter: false,
    params: params
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
      case 'k':
      case 'zaln': { // phrase
        removeLastNewLine(state);
        const phrase = parseWord(state, marker.content); // very similar to word marker, so start with this and modify
        phrase.type = "milestone";
        const milestone = phrase.text.trim();
        if (milestone === '-s') { // milestone start
          delete phrase.text;
          startSpan(state, phrase, marker.tag);
        } else if (milestone === '-e') { // milestone end
          i = endSpan(state, i, markers, marker.tag + "-e\\*");
        }
        break;
      }
      case 'w': { // word
        removeLastNewLine(state, true);
        const wordObject = parseWord(state, marker.content);
        pushObject(state, null, wordObject);
        if (marker.nextChar) {
          pushObject(state, null, marker.nextChar);
        }
        break;
      }
      case 'w*': {
        if (marker.nextChar && (marker.nextChar !== ' ')) {
          pushObject(state, null, marker.nextChar);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (marker) {
          if (marker.content && (marker.content.substr(0, 2) === "\\*")) {
            // is part of usfm3 milestone marker
            marker.content = marker.content.substr(2);
          } else
          if (marker.content && (marker.content.substr(0, 1) === "*")) {
            const phraseParent = getPhraseParent(state);
            if (phraseParent && phraseParent.usfm3Milestone) {
              // is part of usfm3 milestone marker
              marker.content = marker.content.substr(1);
            }
          }
          if (marker.content) {
            processAsText(state, marker);
          }
        }
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
          let {endMarker, spannedUsfm} = checkForEndMarker(marker);
          if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter yet, its a header
            if (spannedUsfm) {
              i = endSpan(state, i, markers, endMarker, true);
            } else {
              pushObject(state, state.headers, createUsfmObject(marker, true));
            }
          } else if (state.currentChapter ||
            (state.params.chunk && state.currentVerse)) {
            if (!endMarker && USFM.markerHasSpecialEndTag(marker.tag)) { // check for one-off end markers
              const startMarker = USFM.markerHasSpecialEndTag(marker.tag);
              endMarker = marker.tag;
              marker.tag = startMarker;
              spannedUsfm = true;
            }
            if (endMarker) { // check for end marker
              if (spannedUsfm) {
                i = endSpan(state, i, markers, endMarker);
              }
            } else if (spannedUsfm) {
              startSpan(state, createUsfmObject(marker), marker.tag);
            } else {
              addToCurrentVerse(state, marker);
            }
          }
        }
      }
    }
  }
  usfmJSON.headers = state.headers;
  getVerseObjectsForBook(usfmJSON, state);
  if (Object.keys(state.verses).length > 0) {
    usfmJSON.verses = getVerseObjectsForChapter(state.verses);
  }
  return usfmJSON;
};
