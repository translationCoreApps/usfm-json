/**
 * @description for converting from json format to USFM.  Main method is jsonToUSFM()
 */

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
  let retVal = '\n';
  if ((nextObject) && (nextObject.type === 'text') && (nextObject.text.substr(0, 1) !== '\n')) {
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
  keys.forEach(function(key) {
    if (!(wordIgnore_.includes(key))) {
      const value = wordObject[key];
      if (wordMap_[key]) { // see if we should convert this key
        key = wordMap_[key];
      }
      let prefix = (key === 'lemma' || key === 'strong') ? '' : 'x-';
      let attribute = prefix + key + '="' + value + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
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
  let line = '\\' + tag + '-s | ' + attributes.join(' ') + '\n';

/* eslint-disable no-use-before-define */
  line = objectToString(phraseObject.children, line);
/* eslint-enable no-use-before-define */
  if (!lastCharIsNewLine(line)) {
    line += '\n';
  }
  line += '\\' + tag + '-e\\*' + needsNewLine(nextObject);
  return line;
};

/**
 * @description convert usfm marker to string
 * @param {object} usfmObject - usfm object to output
 * @return {String} Text equivalent of marker.
 */
const usfmMarkerToString = usfmObject => {
  let output = "";
  const content = usfmObject.text || usfmObject.content || "";
  const markerTermination = usfmObject.endTag;
  if (usfmObject.tag) {
    output = '\\' + usfmObject.tag;
    if (usfmObject.number) {
      output += ' ' + usfmObject.number;
    }
    const firstChar = content.substr(0, 1);
    if (!markerTermination && (firstChar !== '') && (firstChar !== '\n') && (content !== ' \n')) {
      output += ' ';
    } else if (markerTermination && (firstChar !== ' ')) {
      output += ' ';
    }
  }

  if (content) {
    output += content;
  }

  if (markerTermination) {
    output += '\\' + markerTermination;
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
    if ((!lastChar) || (['\n', '"', '“'].indexOf(lastChar) < 0)) {
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

  if (object.type === 'text') {
    return output + object.text;
  }

  if (object.verseObjects) { // support new verse object format
    object = object.verseObjects;
  }

  if (Array.isArray(object)) {
    for (let i = 0; i < object.length; i++) {
      const objectN = object[i];
      const nextObject = (i + 1 < object.length) ? object[i + 1] : null;
      output = objectToString(objectN, output, nextObject);
    }
    return output;
  }

  if (object.type === 'word') { // usfm word marker
    return addOnNewLine(generateWord(object, nextObject), output);
  }

  if (object.type === 'milestone') { // usfm keyterm with milestone (phrase)
    return addOnNewLine(generatePhrase(object, nextObject), output);
  }

  if (object.tag) { // any other USFM marker tag
    return output + usfmMarkerToString(object);
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
  if (lines && lines.length) {
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
  const verseNumbers = Object.keys(chapterObject).sort((a, b) => {
    return parseInt(a, 10) - parseInt(b, 10);
  });
  verseNumbers.forEach(function(verseNumber) {
    // check if verse is inside previous line (such as \q)
    const lastLine = lines.length ? lines[lines.length - 1] : "";
    const lastChar = lastLine ? lastLine.substr(lastLine.length - 1) : "";
    if (lastChar && (lastChar !== '\n') && (lastChar !== '')) { // do we need white space
      lines[lines.length - 1] = lastLine + ' ';
    }
    const verseObjects = chapterObject[verseNumber];
    const verseLine = generateVerse(verseNumber, verseObjects);
    lines = addVerse(lines, verseLine);
  });
  return lines;
};

/**
 * @description convert object to text and add to array.  Objects are terminated with newline
 * @param {array} output - array where text is appended
 * @param {Object} usfmObject - USFM object to convert to string
 */
const outputHeaderObject = (output, usfmObject) => {
  let text = usfmMarkerToString(usfmObject);
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
    chapterNumbers.forEach(function(chapterNumber) {
      const chapterObject = json.chapters[chapterNumber];
      const chapterLines = generateChapterLines(
          chapterNumber, chapterObject,
      );
      output = addChapter(output, chapterLines);
    });
  }
  if (json.verses) {
    const verseNumbers = Object.keys(json.verses);
    verseNumbers.forEach(function(verseNumber) {
      const verseObjects = json.verses[verseNumber];
      const verse = generateVerse(
          verseNumber, verseObjects,
      );
      output = addVerse(output, verse);
    });
  }
  return output.join('');
};
