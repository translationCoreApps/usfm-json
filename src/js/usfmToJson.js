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
 * @param {null|Array} removePrefixOfX - array of attributes we want to remove the 'x-` prefix
 * @return {Object} - object of the word attributes
*/
const parseWord = (state, wordContent, removePrefixOfX = null) => {
  let object = {};
  const wordParts = (wordContent || "").split('|');
  const word = removeLeadingSpace(wordParts[0]);
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
    const regex = /([x-]*)([\w-]+)=['"](.*?)['"]/g;
    const matches = getMatches(attributeContent, regex, true);
    for (let i = 0, len = matches.length; i < len; i++) {
      const match = matches[i];
      let key = match[2];
      const xPrefix = match[1];
      if (xPrefix) {
        if ((removePrefixOfX !== null) && !removePrefixOfX.includes(key)) { // if this is not one of our attributes, leave the `x-` prefix
          key = xPrefix + key;
        }
      }
      if (key === "strongs") { // fix invalid 'strongs' key
        key = "strong";
      }
      if (state.params.map && state.params.map[key]) { // see if we should convert this key
        key = state.params.map[key];
      }
      let value = match[3];
      if (state.params.convertToInt &&
        (state.params.convertToInt.includes(key))) {
        value = parseInt(value, 10);
      }
      object[key] = value;
    }
    if (!matches.length) {
      object[attributeContent] = ""; // place holder for attribute with no value
    }
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
  if (matches.length && (matches[0].index > 0)) { // check for leading text
    const object = makeTextMarker(line.substr(0, matches[0].index - 1));
    array.push(object);
  }
  let lastObject = null;
  if (regex.exec(line)) { // normal formatting with marker followed by content
    for (let i = 0, len = matches.length; i < len; i++) {
      const match = matches[i];
      const orphan = match[1];
      if (orphan) {
        const object = {content: orphan};
        array.push(object);
        match[0] = match[0].substr(orphan.length); // trim out orphan text
        match.index += orphan.length;
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
          const endMatch = match.index + match[0].length;
          const lineLength = line.length;
          const runToEnd = endMatch >= lineLength;
          let startPos = open.length + 2;
          let endPos = match[0].indexOf(match[3], startPos);
          if (endPos < 0) {
            if (!runToEnd) {
              if (match[0] === '\\' + match[2]) {
                object.nextChar = ' ';
              }
            } else {
              endPos = startPos;
              startPos--;
            }
          }
          const prefix = (endPos >= 0) && match[0].substring(startPos, endPos);
          if (prefix) {
            object.content = prefix + (content || "");
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
        if (object.content) {
          let pos = object.content.lastIndexOf(close);
          if (pos >= 0) {
            object.content = object.content.substring(0, pos);
          }
        }
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
        let orphanText = line.substr(endPos) + (lastLine ? '' : '\n');
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
    if (!state.chapters[state.currentChapter][state.currentVerse]) {
      state.chapters[state.currentChapter][state.currentVerse] = [];
    }
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
  let type = USFM.getMarkerType(tagProps);
  let isText = true;
  if (tag) {
    isText = USFM.propDisplayable(tagProps);
    if ((type === 'milestone') && (tag.indexOf('-s') < 0)) { // verify that it actually is a milestone
      type = '';
    }
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
        const contentKey = USFM.markerContentDisplayable(usfmObject.tag) ? 'text' : 'content';
        const lastObject = state.nested[last];
        let output = lastObject[contentKey];
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
        lastObject[contentKey] = output;
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
    if (lastObject.nextChar === '\n') {
      delete lastObject.nextChar;
    }
    else if (lastObject.text) {
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
 * @description - remove previous new line from text
 * @param {object} state - holds parsing state information
 */
const handleWordWhiteSpace = (state) => {
  const saveTo = getSaveToLocation(state);
  if (saveTo && saveTo.length) {
    const lastObject = saveTo[saveTo.length - 1];
    if (lastObject.nextChar === '\n') {
      lastObject.nextChar = ' ';
    }
    else if (lastObject.text) {
      const text = lastObject.text;
      if (isLastCharNewLine((text))) {
        const startOfLine = (saveTo.length === 1) &&
          (lastObject.text.length === 1);
        const removeNewLine = (startOfLine || isNextToLastCharQuote(text));
        if (removeNewLine) {
          if (text.length === 1) {
            saveTo.pop();
          } else {
            lastObject.text = text.substr(0, text.length - 1);
          }
        } else { // replace newline with space
          lastObject.text = text.substr(0, text.length - 1) + ' ';
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
    else if (phraseParent.attrib && !phraseParent.usfm3Milestone && (typeof marker === 'string')) {
      phraseParent.attrib += marker;
    } else {
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
  const parts = endTag.split(' ');
  const endTagBase = parts[0] + (parts.length > 1 ? '\\*' : ''); // remove attributes
  let count = -1;
  if (phraseParent) {
    let terminations = USFM.markerTermination(phraseParent.tag);
    if (!terminations) {
      terminations = [];
    }
    if (terminations && !Array.isArray(terminations)) {
      terminations = [terminations];
    }
    let termination = null;
    for (let i = 0, len = terminations.length; i < len; i++) {
      termination = terminations[i];
      if (termination) {
        matchesParent = (termination === endTagBase) ||
          (phraseParent.tag + termination === endTagBase) ||
          // compare USFM3 milestones such as '\\qt-s' and '\\qt-e\\*`
          (phraseParent.tag.substr(0, phraseParent.tag.length - 2) +
            termination + '\\*' === endTagBase);
        if (matchesParent) {
          break;
        }
      }
    }
    if (!matchesParent &&
      (USFM.SPECIAL_END_TAGS[endTagBase] === phraseParent.tag)) {
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

const getToEndOfAttributes = (content, pos, index, markers) => {
  let endPos = content.indexOf('*', pos);
  while (endPos < 0) { // if attributes overflow to next line
    const nextLine = index + 1;
    if (nextLine >= markers.length) {
      break;
    }
    const nextMarker = markers[nextLine];
    if (!nextMarker.tag && nextMarker.content) {
      endPos = nextMarker.content.indexOf('*');
      if (endPos === 0) { // attributes are ended
        break;
      } else if (endPos < 0) {
        content += nextMarker.content;
        index = nextLine;
        endPos = content.indexOf('*', pos);
      } else {
        const nextContent = nextMarker.content.substr(endPos);
        if (nextMarker.content[endPos - 1] === '\\') {
          endPos--;
        }
        if (endPos > 0) {
          content += nextMarker.content.substr(0, endPos);
          nextMarker.content = nextContent;
        }
        break;
      }
    } else {
      break;
    }
  }
  return {content, index};
};

/**
 * mark the beginning of a spanned usfm
 * @param {object} state - holds parsing state information
 * @param {object} marker - verseObject to save
 * @param {string} tag - tag for verseObject
 * @param {number} index - current position in markers
 * @param {array} markers - parsed markers we are iterating through
 * @return {number} new index
 */
const startSpan = (state, marker, tag, index, markers) => {
  marker.tag = tag;
  const phraseParent = getPhraseParent(state);
  const tagProps = USFM.USFM_PROPERTIES[tag];
  const displayable = USFM.propDisplayable(tagProps);
  if (USFM.propUsfm3Milestone(tagProps)) {
    marker.usfm3Milestone = true;
  }
  if (USFM.propAttributes(tagProps)) {
    const contentKey = USFM.propDisplayable(tagProps) ? 'text' : 'content';
    let content = marker[contentKey];
    if (content) {
      let pos = content.indexOf('|');
      if (pos >= 0) {
        const __ret = getToEndOfAttributes(content, pos, index, markers);
        content = __ret.content;
        index = __ret.index;
        const foundContent = content.substr(0, pos).trim();
        if (!foundContent) {
          pos = 0;
        }
        marker.attrib = content.substr(pos);
        content = content.substr(0, pos);
      }
      if (content) {
        marker[contentKey] = content;
      }
    }
    if (!content) {
      delete marker[contentKey];
    }
  }
  if (phraseParent) {
    if (!USFM.markerContentDisplayable(phraseParent.tag)) {
      phraseParent.content = (phraseParent.content || "") + markerToText(marker);
      incrementPhraseNesting(state, phraseParent, tag);
      return index;
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
      state.phraseParent = getLastItem(state);
    }
    incrementPhraseNesting(state, marker, tag);
  }
  return index;
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
      if ((phraseParent.children !== undefined) &&
            !phraseParent.children.length) {
        delete phraseParent.children; // remove unneeded empty children
      }
      while (phraseParent) {
        const tagBase = phraseParent.tag.split('-')[0];
        if ((tagBase + '*' === endMarker) || (tagBase + '-e\\*' === endMarker)
        ) { // if this is the parent end
          phraseParent.endTag = endMarker;
          break;
        } else {
          phraseParent.endTag = "";
          phraseParent = getPhraseParent(state); // pop next
          popPhrase(state);
        }
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
  if (content && USFM.markerHasEndAttributes(current.tag)) {
    if (phraseParent) {
      const parts = (phraseParent.endTag || "").split('\\*');
      endMarker = parts[0] + content + (parts.length > 1 ? '\\*' : '');
      phraseParent.endTag = endMarker;
      current.content = content = "";
    } else {
      current.attrib = content;
      current.content = content = "";
    }
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
        if (current.attrib) {
          if (terminator.substr(0, 1) === '\\') {
            terminator = terminator.substr(1);
          }
          current.endTag = terminator;
        } else {
          if (!endMarker.includes(terminator)) {
            endMarker += terminator;
          }
          current.tag = endMarker;
        }
        const nextChar = nextContent.substr(trimLength, 1);
        if ((nextChar === ' ') || nextChar === '\n') {
          if (!phraseParent) {
            trimLength++;
            current.nextChar = nextChar;
          }
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
        if (parentContentDisplayable) {
          content = nextChar + (content || "");
        } else {
          phraseParent.nextChar = nextChar;
        }
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
 * makes sure that phrases are terminated before we begin a new verse or chapter
 * @param {object} state - holds parsing state information
 */
const terminatePhrases = state => {
  let phraseParent = getPhraseParent(state);
  while (phraseParent) {
    phraseParent.endTag = '';
    delete phraseParent.nesting;
    delete phraseParent.usfm3Milestone;
    phraseParent = popPhrase(state);
  }
};

/**
 * @description - process marker as a verse
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
const parseAsVerse = (state, marker) => {
  state.inHeader = false;
  terminatePhrases(state);
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
    if (getPhraseParent(state)) {
      saveUsfmObject(state, null, marker.content);
    } else {
      addToCurrentVerse(state, marker.content);
    }
  } else if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter yet, its a header
    pushObject(state, state.headers, createUsfmObject(marker));
  }
  if (state.params.chunk && state.currentVerse > 0 && marker.content) {
    if (!state.verses[state.currentVerse]) {
      state.verses[state.currentVerse] = [];
    }
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
    results = ' ' + text;
  }
  return results;
};

/**
 * @description - convert marker to text
 * @param {object} marker - object to convert to text
 * @param {boolean} noSpaceAfterTag - if true then don't add space after tag
 * @return {string} text representation of marker
 */
const markerToText = (marker, noSpaceAfterTag = false) => {
  if (!marker.tag) {
    return marker.text || marker.content;
  }
  let text = '\\' + marker.tag;
  if (marker.number) {
    text += " " + marker.number;
  }
  const content = marker.content || marker.text;
  if (noSpaceAfterTag) {
    text += content;
  } else {
    text += addTextField(content);
  }
  if (marker.attrib) {
    const dashPos = marker.tag.indexOf('-');
    const suffix = dashPos > 0 ? marker.tag.substr(dashPos + 1, 1) : '';
    const spannedTag = ['s', 'e'].includes(suffix);
    if (!content && (!suffix || !spannedTag)) {
      text += ' ';
    }
    text += marker.attrib;
    if (spannedTag) {
      text += '\\';
    }
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
  state.inHeader = false;
  terminatePhrases(state);
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
 * add marker to header
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 */
const addHeaderMarker = (state, marker) => {
  const nextChar = marker.nextChar; // save nextChar
  const usfmObject = createUsfmObject(marker, true);
  if (nextChar !== undefined) {
    usfmObject.nextChar = nextChar; // add back in
  }
  const lastHeader = (state.headers.length) ?
    state.headers[state.headers.length - 1] : null;
  const lastNext = lastHeader ? lastHeader.nextChar : null;
  const appendToLast = lastHeader && (lastNext !== '\n');
  if (appendToLast) {
    const markerContent = (marker.content || marker.text || '');
    const noSpaceAfterTag = (markerContent.substr(0, 1) === '*'); // special handling for end tags
    const key = (lastHeader.text) ? 'text' : 'content';
    let content = (lastHeader[key] || '') + (lastHeader.next || '') + markerToText(marker, noSpaceAfterTag);
    delete lastHeader.next;
    if (content.substr(-1) === '\n') {
      lastHeader.nextChar = '\n';
      content = content.substr(0, content.length - 1); // trim off
    }
    lastHeader[key] = content;
  } else {
    if (usfmObject.text && (!usfmObject.nextChar) && (usfmObject.text.substr(-1) === '\n')) {
      usfmObject.nextChar = '\n';
      usfmObject.text = usfmObject.text.substr(0, usfmObject.text.length - 1); // trim off
    }
    state.headers.push(usfmObject);
  }
};

/**
 * processes the marker checking for spans
 * @param {object} state - holds parsing state information
 * @param {object} marker - marker object containing content
 * @param {Number} i - current index in markers
 * @param {Array} markers - array of parsed markers
 * @return {Number} new index in markers
 */
const processMarkerForSpans = (state, marker, i, markers) => {
  let {endMarker, spannedUsfm} = checkForEndMarker(marker);
  if (!endMarker && USFM.markerHasSpecialEndTag(marker.tag)) { // check for one-off end markers
    const startMarker = USFM.markerHasSpecialEndTag(marker.tag);
    endMarker = marker.tag;
    marker.tag = startMarker;
    spannedUsfm = true;
  }
  if (endMarker) { // check for end marker
    if (spannedUsfm) {
      i = endSpan(state, i, markers, endMarker, state.inHeader);
    }
  } else if (spannedUsfm) {
    i = startSpan(state, createUsfmObject(marker), marker.tag, i, markers);
  } else {
    addToCurrentVerse(state, marker);
  }
  return i;
};

/**
 * clean of trailing newlines in headers since it is implicit
 * @param {object} state - holds parsing state information
 */
const cleanupHeaderNewLines = state => {
  for (let i = 0; i < state.headers.length; i++) {
    const header = state.headers[i];
    if (header.type === 'text') {
      header.text += (header.nextChar || '');
      while (i + 1 < state.headers.length) {
        const headerNext = (i + 1) < state.headers.length ?
          state.headers[i + 1] : {};
        if (headerNext.type === 'text') {
          header.text += headerNext.text + (headerNext.nextChar || '');
          state.headers.splice(i + 1, 1);
        } else {
          break;
        }
      }
      if (header.text.substr(-1) === '\n') {
        header.text = header.text.substr(0, header.text.length - 1);
      }
    }
    if (header && header.nextChar === '\n') {
      delete header.nextChar;
    }
  }
};

/**
 * process this as a general marker
 * @param {object} state - holds parsing state information
 * @param {Object} marker - current marker
 * @param {Number} index - current marker index
 * @param {Array} markers - array of all markers
 * @return {Number} updated index
 */
const processMarker = (state, marker, index, markers) => {
  if (state.currentChapter === 0 && !state.currentVerse) { // if we haven't seen chapter or verse yet, its a header
    state.inHeader = true;
    addHeaderMarker(state, marker);
  } else if (state.currentChapter ||
    (state.params.chunk && state.currentVerse)) {
    index = processMarkerForSpans(state, marker, index, markers);
  }
  return index;
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
    markers.push.apply(markers, parsedLine); // fast concat
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
    inHeader: true,
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
        if (state.inHeader) {
          addHeaderMarker(state, marker);
        } else {
          const phrase = parseWord(state, marker.content); // very similar to word marker, so start with this and modify
          phrase.type = "milestone";
          const milestone = phrase.text.trim();
          if (milestone === '-s') { // milestone start
            removeLastNewLine(state);
            delete phrase.text;
            i = startSpan(state, phrase, marker.tag, i, markers);
          } else if (milestone === '-e') { // milestone end
            removeLastNewLine(state);
            i = endSpan(state, i, markers, marker.tag + "-e\\*");
          } else {
            i = processMarkerForSpans(state, marker, i, markers); // process as regular marker
          }
        }
        break;
      }
      case 'w': { // word
        if (state.inHeader) {
          addHeaderMarker(state, marker);
        } else {
          handleWordWhiteSpace(state);
          const wordObject = parseWord(state, marker.content,
            USFM.wordSpecialAttributes);
          pushObject(state, null, wordObject);
          if (marker.nextChar) {
            pushObject(state, null, marker.nextChar);
          }
        }
        break;
      }
      case 'w*': {
        if (state.inHeader) {
          addHeaderMarker(state, marker);
        } else if (marker.nextChar && (marker.nextChar !== ' ')) {
          pushObject(state, null, marker.nextChar);
        }
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (marker) {
          if (state.inHeader) {
            addHeaderMarker(state, marker);
          }
          else if (marker.content && (marker.content.substr(0, 2) === "\\*")) {
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
          i = processMarker(state, marker, i, markers);
        }
      }
    }
  }
  terminatePhrases(state);
  cleanupHeaderNewLines(state);
  usfmJSON.headers = state.headers;
  getVerseObjectsForBook(usfmJSON, state);
  if (Object.keys(state.verses).length > 0) {
    usfmJSON.verses = getVerseObjectsForChapter(state.verses);
  }
  return usfmJSON;
};
