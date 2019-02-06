/* eslint-disable brace-style */
/**
 * @description for converting from json format to USFM.  Main method is jsonToUSFM()
 */

import * as USFM from './USFM';

let params_ = {};
let wordMap_ = {};
let wordIgnore_ = [];
let milestoneMap_ = {};
let milestoneIgnore_ = [];
let lastObject_ = null;
let currentObject_ = null;

/**
 * @description checks if we need to add a newline if next object is not text or newline
 * @param {Object} nextObject - next object to be output
 * @return {String} either newline or empty string
 */
const needsNewLine = nextObject => {
  let retVal = '\n';
  if (nextObject && (nextObject.type === 'text')) {
    retVal = '';
  }
  return retVal;
};

/**
 * @description test if last character was newline (or return) char
 * @param {String} line - line to test
 * @return {boolean} true if newline
 */
const lastCharIsNewLine = line => {
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
  let attributes = [];
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
    attrOut = '|' + attrOut;
  }
  let line = '\\w ' + word + attrOut + '\\w*';
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
  if (typeof phraseObject.endTag === 'string') {
    markerTermination = phraseObject.endTag; // new format takes precidence
    delete phraseObject.endTag;
  } else {
    markerTermination = tag + '-e\\*'; // fall back to old generation method
  }
  let content = '';
  const milestoneType = (phraseObject.type === 'milestone');
  if (milestoneType) {
    const keys = Object.keys(phraseObject);
    let attributes = [];
    keys.forEach(function(key) {
      if (!(milestoneIgnore_.includes(key))) {
        const value = phraseObject[key];
        if (milestoneMap_[key]) { // see if we should convert this key
          key = milestoneMap_[key];
        }
        let prefix = 'x-';
        let attribute = prefix + key + '="' + value + '"';
        attributes.push(attribute);
      }
    });
    content = '-s | ' + attributes.join(' ') + '\n';
  } else {
    const isUsfm3Milestone = USFM.markerIsMilestone(tag);
    if (isUsfm3Milestone) {
      if (phraseObject.attrib) {
        content = phraseObject.attrib;
      }
      content += "\\*";
    }
    if (phraseObject.text) {
      content += ' ' + phraseObject.text;
    }
    if (phraseObject.content) {
      content += ' ' + phraseObject.content;
    }
  }
  let line = '\\' + tag + content;

/* eslint-disable no-use-before-define */
  line = objectToString(phraseObject.children, line);
/* eslint-enable no-use-before-define */
  if (milestoneType && !lastCharIsNewLine(line)) {
    line += '\n';
  }
  if (markerTermination) {
    line += '\\' + markerTermination +
              (phraseObject.nextChar || needsNewLine(nextObject));
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
 * @description adds text to the line and makes sure it is on a new line
 * @param {String} text - to add
 * @param {String} output - string to add to
 * @return {String} updated output
 */
const addOnNewLine = (text, output) => {
  output = output || "";
  if (text) {
    const lastChar = (output) ? output.substr(output.length - 1) : '';
    if (params_.forcedNewLines && ((!lastChar) || (lastChar !== '\n'))) {
      text = '\n' + text;
    }
    output += text;
  }
  return output;
};

/**
 * @description adds word to the line and makes sure it has appropriate spacing
 * @param {String} text - to add
 * @param {String} output - string to add to
 * @return {String} updated output
 */
const addWord = (text, output) => {
  output = output || "";
  if (text) {
    let prefixNewLine = false;
    const lastChar = (output) ? output.substr(output.length - 1) : '';
    if (params_.forcedNewLines) {
      if (!lastChar) { // if beginning of line
        prefixNewLine = true;
      } else if (lastChar === ' ') {
        output = output.substr(0, output.length - 1); // trim space
        prefixNewLine = true;
      } else if ((lastChar !== '\n') && (lastObject_.type === 'word')) {
        prefixNewLine = true;
      }
    } else if (lastObject_ && (lastObject_.type === 'word') && lastChar && (lastChar !== ' ')) { // make sure spaces between words
      text = ' ' + text;
    }
    if (prefixNewLine) {
      text = '\n' + text;
    }
    output += text;
  }
  return output;
};

/**
 * @description converts object to string and appends to line
 * @param {string|array|object} object - marker to print
 * @param {string} output - marker to print
 * @param {String|array|object} nextObject - optional object that is next entry.  Used to determine if we need to
 *                                add a space between current marker and following text
 * @return {String} Text equivalent of marker appended to output.
 */
const objectToString = (object, output, nextObject) => {
  if (!object) {
    return "";
  }

  output = output || "";

  if (object.verseObjects) { // support new verse object format
    object = object.verseObjects;
  }

  if (Array.isArray(object)) {
    let nextObject;
    for (let i = 0, len = object.length; i < len; i++) {
      const objectN = nextObject ? nextObject : object[i];
      nextObject = (i + 1 < object.length) ? object[i + 1] : null;
      output = objectToString(objectN, output, nextObject);
    }
    return output;
  }

  lastObject_ = currentObject_;
  currentObject_ = object;

  if (object.type === 'text') {
    return output + object.text;
  }

  if (object.type === 'word') { // usfm word marker
    return addWord(generateWord(object, nextObject), output);
  }
  if ((object.type === 'milestone') && (object.endTag !== object.tag + '*')) { // milestone type (phrase)
    return addOnNewLine(generatePhrase(object, nextObject), output);
  }
  else if (object.children && object.children.length) {
    return output + generatePhrase(object, nextObject);
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
    if (!lastCharIsNewLine(lastLine)) { // need to add newline
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
    if (!lastCharIsNewLine(lastLine)) { // need to add newline
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
 * @description Takes in chapter json and outputs it as a USFM line array.
 * @param {String} chapterNumber - number to use for the chapter
 * @param {Object} chapterObject - chapter in JSON
 * @return {Array} - chapter in USFM lines/string
 */
const generateChapterLines = (chapterNumber, chapterObject) => {
  let lines = [];
  lines.push('\\c ' + chapterNumber + '\n');
  if (chapterObject.front) { // handle front matter first
    const verseText = objectToString(chapterObject.front);
    lines = lines.concat(verseText);
    delete chapterObject.front;
  }
  const verseNumbers = sortVerses(Object.keys(chapterObject));
  const verseLen = verseNumbers.length;
  for (let i = 0; i < verseLen; i++) {
    const verseNumber = verseNumbers[i];
    // check if verse is inside previous line (such as \q)
    const lastLine = lines.length ? lines[lines.length - 1] : "";
    const lastChar = lastLine ? lastLine.substr(lastLine.length - 1) : "";
    if (lastChar && (lastChar !== '\n') && (lastChar !== ' ')) { // do we need white space
      lines[lines.length - 1] = lastLine + ' ';
    }
    const verseObjects = chapterObject[verseNumber];
    const verseLine = generateVerse(verseNumber, verseObjects);
    lines = addVerse(lines, verseLine);
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
  milestoneIgnore_ = ['children', 'tag', 'type'];
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
    for (let header of json.headers) {
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
