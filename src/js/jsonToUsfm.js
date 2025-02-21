/* eslint-disable brace-style */
/**
 * @description for converting from json format to USFM.  Main method is jsonToUSFM()
 */

import * as USFM from './USFM';
import {usfmToJSON} from "./usfmToJson";

let params_ = {};
let wordMap_ = {};
let wordIgnore_ = [];
let milestoneMap_ = {};
let milestoneIgnore_ = [];

/**
 * @description checks if we need to add a newline if next object is not text or newline
 * @param {Object} nextObject - next object to be output
 * @return {String} either newline or empty string
 */
const needsNewLine = nextObject => {
  let retVal = '';
  if (nextObject && (nextObject.tag === 'zaln')) {
    retVal = '\n'; // prevent cramming of alignments together
  }
  return retVal;
};

/**
 * @description test if last character was newline (or return) char
 * @param {String} line - line to test
 * @return {boolean} true if newline
 */
const isLastCharNewLine = line => {
  const lastChar = (line) ? line.substr(line.length - 1) : '';
  return (lastChar === '\n');
};

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} wordObject - word in JSON
 * @param {Object} nextObject - next object to be output
 * @return {String} - word in USFM
 */
const generateWord = (wordObject, nextObject) => {
  const keys = Object.keys(wordObject);
  const attributes = [];
  const word = wordObject.text;
  for (let i = 0, len = keys.length; i < len; i++) {
    let key = keys[i];
    if (!(wordIgnore_.includes(key))) {
      const value = wordObject[key];
      if (wordMap_[key]) { // see if we should convert this key
        key = wordMap_[key];
      }
      let prefix = '';
      if (USFM.wordSpecialAttributes.includes(key)) {
        prefix = 'x-';
      }
      let attribute = prefix + key;
      if (value) { // add value only if set
        attribute += '="' + value + '"';
      }
      attributes.push(attribute);
    }
  }
  let attrOut = attributes.join(' ');
  if (attrOut) {
    attrOut = '|' + attrOut.trimLeft();
  }
  const line = '\\w ' + word + attrOut + '\\w*';
  return line;
};

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} phraseObject - word in JSON
 * @param {Object} nextObject - next object to be output
 * @return {String} - word in USFM
 */
const generatePhrase = (phraseObject, nextObject) => {
  const tag = phraseObject.tag || 'zaln';
  let markerTermination = '';
  let nextChar = phraseObject.nextChar;
  if (typeof phraseObject.endTag === 'string') {
    markerTermination = phraseObject.endTag; // new format takes precedence
  } else {
    markerTermination = tag + '-e\\*'; // fall back to old generation method
  }
  let content = '';
  const milestoneType = (phraseObject.type === 'milestone');
  if (milestoneType) {
    const keys = Object.keys(phraseObject);
    const attributes = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];
      if (!(milestoneIgnore_.includes(key))) {
        const value = phraseObject[key];
        if (milestoneMap_[key]) { // see if we should convert this key
          key = milestoneMap_[key];
        }
        const prefix = 'x-';
        const attribute = prefix + key + '="' + value + '"';
        attributes.push(attribute);
      }
    }
    content = '-s |' + attributes.join(' ').trimLeft() + '\\*';
  } else {
    const isUsfm3Milestone = USFM.markerIsMilestone(tag);
    if (isUsfm3Milestone) {
      if (phraseObject.attrib) {
        content = phraseObject.attrib;
      }
      content += "\\*";
    }
    if (phraseObject.text) {
      // check if we need padding
      const firstChar = phraseObject.text.substring(0, 1);
      const isWhiteSpace = (firstChar === ' ') || (firstChar === '\n');
      content += (isWhiteSpace ? '' : ' ') + phraseObject.text;
    }
    if (phraseObject.content) {
      content += ' ' + phraseObject.content;
    }
    if (!content && nextChar) {
      content = nextChar;
      nextChar = '';
    }
  }
  let line = '\\' + tag + content;

/* eslint-disable no-use-before-define */
  line = objectToString(phraseObject.children, line);
/* eslint-enable no-use-before-define */

  if (markerTermination) {
    line += '\\' + markerTermination +
              (nextChar || needsNewLine(nextObject));
  }
  return line;
};

/**
 * @description convert usfm marker to string
 * @param {object} usfmObject - usfm object to output
 * @param {object} nextObject - usfm object that will come next
 * @param {Boolean} noSpaceAfterTag - if true then do not put space after tag
 * @param {Boolean} noTermination - if true then do not add missing termination
 * @return {String} Text equivalent of marker.
 */
const usfmMarkerToString = (usfmObject, nextObject = null,
  noSpaceAfterTag = false,
  noTermination = false) => {
  let output = "";
  let content = usfmObject.text || usfmObject.content || "";
  let markerTermination = usfmObject.endTag; // new format takes precidence
  if ((typeof markerTermination !== 'string') && USFM.markerTermination(usfmObject.tag) && !noTermination) {
    markerTermination = usfmObject.tag + '*'; // fall back to old generation method
  }
  if (usfmObject.tag) {
    output = '\\' + usfmObject.tag;
    if (usfmObject.number) {
      output += ' ' + usfmObject.number;
    }
    const firstChar = content.substr(0, 1);
    if (noSpaceAfterTag) {
      // no spacing
    }
    else if (usfmObject.attrib) {
      if (content) {
        output += ' ' + content;
      }
      if (usfmObject.tag.substr(-2) === '\\*') { // we need to apply attibute before \*
        output = output.substr(0, output.length - 2) + usfmObject.attrib +
          output.substr(-2);
      } else {
        output += usfmObject.attrib;
      }
      content = '';
    }
    else if (!markerTermination) {
      if ((firstChar !== '') && (firstChar !== '\n') && (content !== ' \n')) { // make sure some whitespace
        output += ' ';
      }
      else if (nextObject && usfmObject.tag && !content && // make sure some whitespace
                !usfmObject.nextChar && !['w', 'k', 'zaln'].includes(nextObject.tag)) {
        output += ' ';
      }
    } else if (firstChar !== ' ') { // if marker termination, make sure we have space
      output += ' ';
    }
  }

  if (content) {
    output += content;
  }

  if (markerTermination) {
    output += '\\' + markerTermination;
  }
  if (usfmObject.nextChar) {
    output += usfmObject.nextChar;
  }
  return output;
};

/**
 * determines if we are currently on a displayable line
 * @param {String} output - previous output
 * @return {boolean}
 */
const isOnDisplayableLine = (output) => {
  let isDisplayableLine = false;
  const pos = output.lastIndexOf('\\');
  if (pos >= 0) {
    const endSegment = output.substr(pos + 1);
    const parts = endSegment.split(' ');
    if ((parts.length === 2) && (parts[1] === '')) {
      isDisplayableLine = USFM.markerDisplayable(parts[0]);
    }
  }
  return isDisplayableLine;
};

/**
 * @description adds word to the line and makes sure it has appropriate spacing
 * @param {String} text - to add
 * @param {String} output - string to add to
 * @return {String} updated output
 */
const addPhrase = (text, output) => {
  let prefixNewLine = false;
  output = output || "";
  if (text) {
    prefixNewLine = false;
    const lastChar = (output) ? output.substr(output.length - 1) : '';
    if (params_.forcedNewLines) {
      if (lastChar === ' ') {
        if (!isOnDisplayableLine(output)) {
          output = output.substr(0, output.length - 1); // trim space
          prefixNewLine = true;
        }
      }
    }
    if (prefixNewLine) {
      text = '\n' + text;
    }
    output += text;
  }
  return output;
};

/**
 * check if text contains a paragraph marker.  Imprecise check just to save time before doing more extensive checking.
 * @param {string} text
 * @return {boolean}
 */
function hasParagraph(text) {
  let hasParagraph_ = false;
  if (text.includes('\\')) { // check if USFM markers in text
    const paragraphStarts = ['\\p', '\\m', '\\c', '\\n', '\\b'];
    for (const mark of paragraphStarts) { // check for paragraph markers
      if (text.includes(mark)) {
        hasParagraph_ = true;
        break;
      }
    }
  }
  return hasParagraph_;
}

/**
 * @description converts object to string and appends to line
 * @param {string|array|object} object - marker to print
 * @param {string} output - marker to print
 * @param {String|array|object} nextObject - optional object that is next entry.  Used to determine if we need to
 *                                add a space between current marker and following text
 * @return {String} Text equivalent of marker appended to output.
 */
const objectToString = (object, output, nextObject = null) => {
  if (!object || !Object.keys(object).length) {
    return output; // do not add to output
  }

  output = output || "";

  if (object.verseObjects) { // support new verse object format
    object = object.verseObjects;
  }

  if (Array.isArray(object)) {
    let nextObject;
    for (let i = 0, len = object.length; i < len; i++) {
      const objectN = nextObject ? nextObject : object[i];
      nextObject = (i + 1 < len) ? {...object[i + 1]} : null;
      output = objectToString(objectN, output, nextObject);
    }
    return output;
  }

  if (object.type === 'text') {
    let text = object.text || '';
    if (hasParagraph(text)) {
      // TODO: convert to JSON and back for clean up
      const verseObjects = usfmToJSON('\\v 1 ' + text, {chunk: true});
      const newText = jsonToUSFM(verseObjects).substr(5); // convert back to text and string out verse marker
      if (newText !== text) {
        console.log(`text updated to ${newText}`);
        text = newText;
      }
    }
    return output + text;
  }

  if (object.type === 'word') { // usfm word marker
    return addPhrase(generateWord(object, nextObject), output);
  }
  if ((object.type === 'milestone') && (object.endTag !== object.tag + '*')) { // milestone type (phrase)
    return addPhrase(generatePhrase(object, nextObject), output);
  } else if (object.children && object.children.length) {
    return output + generatePhrase(object, nextObject);
  }
  if (object.type === 'paragraph') {
    let checkAhead = false; // if true need to check next object for leading text
    // paragraphs have no whitespace before a newline
    if (object.text) {
      if (object.text.endsWith('\n')) {
        const text = object.text.substr(0, object.text.length - 1);
        object.text = `${text.trimRight()}\n`;
      } else if (object.text.trim() === '') {
        object.text = '';
        if (object.nextChar === ' ') {
          checkAhead = true;
        }
      }
    } else if (object.nextChar === ' ') {
      checkAhead = true;
    }
    if (checkAhead) {
      // if next is text object, trim leading spaces
      if (nextObject) {
        if (nextObject.type === 'text') {
          const text = (nextObject.text || '').trimLeft();
          if (text) {
            nextObject.text = text;
          } else { // remove text object that is empty
            delete nextObject.text;
            delete nextObject.type;
            nextObject = null;
            delete object.nextChar;
          }
        }
      } else if (object.nextChar === ' ') {
        // if end of verse, remove space after paragraph
        delete object.nextChar;
      }
    }
  }
  if (object.tag) { // any other USFM marker tag
    return output + usfmMarkerToString(object, nextObject);
  }
  return output;
};

/**
 * @description Takes in verse json and outputs it as a USFM line array.
 * @param {String} verseNumber - number to use for the verse
 * @param {Array|Object} verseObjects - verse in JSON
 * @return {String} - verse in USFM
 */
const generateVerse = (verseNumber, verseObjects) => {
  const verseText = objectToString(verseObjects);
  const object = {
    tag: 'v',
    number: verseNumber,
    text: verseText
  };
  return usfmMarkerToString(object);
};

/**
 * @description adds verse to lines array, makes sure there is a newline before verse
 * @param {Array} lines - array to add to
 * @param {String} verse - line to add
 * @return {Array} updated lines array
 */
const addVerse = (lines, verse) => {
  if (params_.forcedNewLines && lines && lines.length) {
    const lastLine = lines[lines.length - 1];
    if (!isLastCharNewLine(lastLine)) { // need to add newline
      const quoted = lastLine.indexOf('\n\\q') >= 0;
      if (!quoted) { // don't add newline before verse if quoted
        verse = '\n' + verse;
      }
    }
  }
  lines = lines.concat(verse);
  return lines;
};

/**
 * @description adds chapter to lines array, makes sure there is a newline before chapters
 * @param {Array} lines - array to add to
 * @param {Array} chapter - chapter lines to add
 * @return {Array} updated lines array
 */
const addChapter = (lines, chapter) => {
  if (lines && lines.length) {
    const lastLine = lines[lines.length - 1];
    if (!isLastCharNewLine(lastLine)) { // need to add newline
      if (chapter && chapter.length) {
        chapter[0] = '\n' + chapter[0]; // add newline to start of chapter
      }
    }
  }
  lines = lines.concat(chapter);
  return lines;
};

/**
 * get sorted list of verses. `front` will be first, the rest sorted alphabetically
 * @param {Array} verses - to sort
 * @return {string[]} sorted verses
 */
const sortVerses = verses => {
  const sortedVerses = verses.sort((a, b) => {
    let delta = parseInt(a, 10) - parseInt(b, 10);
    if (delta === 0) { // handle verse spans, unspanned verse first
      delta = (a > b) ? 1 : -1;
    }
    return delta;
  });
  return sortedVerses;
};

/**
 * get the last line and last character of that line
 * @param {Array} lines
 * @return {{lastLine: string, lastChar: string, position: number}} results
 */
function getLastLine(lines) {
  const position = lines.length - 1;
  const lastLine = lines.length ? lines[position] : "";
  const lastChar = lastLine ? lastLine.substr(lastLine.length - 1) : "";
  return {lastLine, lastChar, position};
}

/**
 * gets the last character of the last line and make sure it is a newline
 * @param {Array} lines
 */
function makeSureEndsWithNewLine(lines) {
  const {lastChar, position} = getLastLine(lines);
  if (lastChar && (lastChar !== '\n')) {
    // make sure newline at end
    lines[position] += '\n';
  }
}

/**
 * make sure paragraphs without text start a new line
 * @param {array} verseObjects
 * @param {array} lines
 */
function makeSureParagraphsAtEndHaveLineFeeds(verseObjects, lines) {
  if (verseObjects) {
    if (verseObjects.length > 0) {
      let lastPos = verseObjects.length - 1;
      // skip over empty objects
      while ((lastPos > 0) && (!Object.keys(verseObjects[lastPos]).length)) {
        lastPos--;
      }
      const lastObject = verseObjects[lastPos];
      if (lastObject && (lastObject.type === 'paragraph') && !(lastObject.text && lastObject.text.trim())) {
        makeSureEndsWithNewLine(lines);
      } else if (lastObject.children) {
        makeSureParagraphsAtEndHaveLineFeeds(lastObject.children, lines);
      }
    }
  }
}

/**
 * @description Takes in chapter json and outputs it as a USFM line array.
 * @param {String} chapterNumber - number to use for the chapter
 * @param {Object} _chapterObject - chapter in JSON
 * @return {Array} - chapter in USFM lines/string
 */
const generateChapterLines = (chapterNumber, _chapterObject) => {
  let lines = [];
  lines.push('\\c ' + chapterNumber + '\n');
  const chapterObject = {..._chapterObject};
  if (chapterObject.front) { // handle front matter first
    const verseText = objectToString(chapterObject.front);
    lines = lines.concat(verseText);
    const frontVerseObjects = chapterObject.front;
    makeSureParagraphsAtEndHaveLineFeeds(frontVerseObjects.verseObjects, lines);
    delete chapterObject.front;
  }
  const verseNumbers = sortVerses(Object.keys(chapterObject));
  const verseLen = verseNumbers.length;
  for (let i = 0; i < verseLen; i++) {
    const verseNumber = verseNumbers[i];
    // check if verse is inside previous line (such as \q)
    const {lastLine, lastChar, position} = getLastLine(lines);
    if (lastChar && (lastChar !== '\n') && (lastChar !== ' ')) { // do we need white space
      lines[position] = lastLine + ' ';
    }
    const verseObjects = chapterObject[verseNumber];
    const verseLine = generateVerse(verseNumber, verseObjects);
    lines = addVerse(lines, verseLine);
    makeSureParagraphsAtEndHaveLineFeeds(verseObjects.verseObjects, lines);
  }
  return lines;
};

/**
 * @description convert object to text and add to array.  Objects are terminated with newline
 * @param {array} output - array where text is appended
 * @param {Object} usfmObject - USFM object to convert to string
 */
const outputHeaderObject = (output, usfmObject) => {
  let noSpace = false;
  if (usfmObject.content) {
    const firstChar = usfmObject.content.substr(0, 1);
    noSpace = ['-', '*'].includes(firstChar) || (usfmObject.content.substr(0, 2) === '\\*');
  }
  let text = usfmMarkerToString(usfmObject, null, noSpace, true);
  if (usfmObject.type === 'text' && (typeof usfmObject.text === 'string')) {
    text += '\n';
  } else
  if (usfmObject.tag) {
    text += '\n';
  }
  output.push(text);
};

/**
 * @description Goes through parameters and populates ignore lists and parameter maps
 *                for words and milestones
 */
const processParams = () => {
  wordMap_ = params_.map ? params_.map : {};
  wordMap_.strongs = 'strong';
  wordIgnore_ = ['text', 'tag', 'type'];
  if (params_.ignore) {
    wordIgnore_ = wordIgnore_.concat(params_.ignore);
  }
  milestoneMap_ = params_.mileStoneMap ? params_.mileStoneMap : {};
  milestoneMap_.strongs = 'strong';
  milestoneIgnore_ = ['children', 'tag', 'type', 'endTag'];
  if (params_.mileStoneIgnore) {
    milestoneIgnore_ = milestoneIgnore_.concat(params_.mileStoneIgnore);
  }
};

/**
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @param {Object} params - optional parameters like attributes to ignore.  Properties:
 *                    chunk {boolean} - if true then output is just a small piece of book
 *                    ignore (Array} - list of attributes to ignore on word objects
 *                    map {Object} - dictionary of attribute names to map to new name on word objects
 *                    mileStoneIgnore (Array} - list of attributes to ignore on milestone objects
 *                    mileStoneMap {Object} - dictionary of attribute names to map to new name on milestone objects
 *                    forcedNewLines (boolean} - if true then we add newlines before alignment tags, verses, words
 * @return {String} - Scripture in USFM
 */
export const jsonToUSFM = (json, params) => {
  params_ = params || {}; // save current parameters
  processParams();
  let output = [];
  if (json.headers) {
    for (const header of json.headers) {
      outputHeaderObject(output, header);
    }
  }
  if (json.chapters) {
    const chapterNumbers = Object.keys(json.chapters);
    const chapterLen = chapterNumbers.length;
    for (let i = 0; i < chapterLen; i++) {
      const chapterNumber = chapterNumbers[i];
      const chapterObject = json.chapters[chapterNumber];
      const chapterLines = generateChapterLines(
        chapterNumber, chapterObject,
      );
      output = addChapter(output, chapterLines);
    }
  }
  if (json.verses) {
    const verseNumbers = sortVerses(Object.keys(json.verses));
    const verseLen = verseNumbers.length;
    for (let i = 0; i < verseLen; i++) {
      const verseNumber = verseNumbers[i];
      const verseObjects = json.verses[verseNumber];
      const verse = generateVerse(
        verseNumber, verseObjects,
      );
      output = addVerse(output, verse);
    }
  }
  return output.join('');
};
