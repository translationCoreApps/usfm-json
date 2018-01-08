import * as USFM from './USFM';

let params_ = {};

/**
 * @description checks if we need to add a newline if next object is not text or newline
 * @param {Object} nextObject - next object to be output
 * @return {string} either newline or empty string
 */
const needsNewLine = nextObject => {
  let retVal = '\n';
  if ((nextObject) && (nextObject.type === 'text') && (nextObject.text.substr(0, 1) !== '\n')) {
    retVal = '';
  }
  return retVal;
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
  let ignore = ['text', 'tag', 'type'];
  if (params_.ignore) {
    ignore = ignore.concat(params_.ignore);
  }
  const word = wordObject.text;
  keys.forEach(function(key) {
    if (!(ignore.includes(key))) {
      let prefix = (key === 'lemma' || key === 'strong') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*' + needsNewLine(nextObject);
  return line;
};

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} phraseObject - word in JSON
 * @param {Object} nextObject - next object to be output
 * @return {String} - word in USFM
 */
const generatePhrase = (phraseObject, nextObject) => {
  const keys = Object.keys(phraseObject);
  let attributes = [];
  let ignore = ['children', 'tag', 'type'];
  if (params_.ignore) {
    ignore = ignore.concat(params_.ignore);
  }
  keys.forEach(function(key) {
    if (!(ignore.includes(key))) {
      let prefix = 'x-';
      let attribute = prefix + key + '="' + phraseObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\k-s | ' + attributes.join(' ') + '\n';

/* eslint-disable no-use-before-define */
  line += objectToString(phraseObject.children);
/* eslint-enable no-use-before-define */
  line += "\\k-e\\*" + needsNewLine(nextObject);
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
  const markerRequiresTermination =
    USFM.markerRequiresTermination(usfmObject.tag);
  if (usfmObject.tag) {
    output = '\\' + usfmObject.tag;
    if (usfmObject.number) {
      output += ' ' + usfmObject.number;
    }
    const firstChar = content.substr(0, 1);
    if (!markerRequiresTermination && (firstChar !== '') && (firstChar !== '\n') && (content !== ' \n')) {
      output += ' ';
    } else if (markerRequiresTermination && (firstChar !== ' ')) {
      output += ' ';
    }
  }

  if (content) {
    output += content;
  }

  if (markerRequiresTermination) {
    output += '\\' + usfmObject.tag + '*';
  }
  return output;
};

/**
 * @description Identifies type of
 * @param {string|array|object} object - marker to print
 * @param {String|array|object} nextObject - optional object that is next entry.  Used to determine if we need to
 *                                add a space between current marker and following text
 * @return {String} Text equivalent of marker.
 */
const objectToString = (object, nextObject) => {
  if (!object) {
    return "";
  }

  if (object.type === 'text') {
    return object.text;
  }

  if (object.verseObjects) { // support new verse object format
    object = object.verseObjects;
  }

  if (Array.isArray(object)) {
    let output = "";
    for (let i = 0; i < object.length; i++) {
      const objectN = object[i];
      const nextObject = (i + 1 < object.length) ? object[i + 1] : null;
      let text = objectToString(objectN, nextObject);
      if (text) {
        output += text;
      }
    }
    return output;
  }

  if (object.type === 'word') { // usfm word marker
    return generateWord(object, nextObject);
  }

  if (object.type === 'milestone') { // usfm keyterm with milestone (phrase)
    return generatePhrase(object, nextObject);
  }

  if (object.tag) { // any other USFM marker tag
    return usfmMarkerToString(object);
  }
  return "";
};

/**
 * @description Takes in verse json and outputs it as a USFM line array.
 * @param {String} verseNumber - number to use for the verse
 * @param {Array|Object} verseObjects - verse in JSON
 * @return {Array} - verse in USFM lines/string
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
    lines = lines.concat(verseLine);
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
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
 */
export const jsonToUSFM = (json, params) => {
  params_ = params || {}; // save current parameters
  USFM.init();
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
      output = output.concat(chapterLines);
    });
  }
  if (json.verses) {
    const verseNumbers = Object.keys(json.verses);
    verseNumbers.forEach(function(verseNumber) {
      const verseObjects = json.verses[verseNumber];
      const verse = generateVerse(
          verseNumber, verseObjects,
      );
      output = output.concat(verse);
    });
  }
  return output.join('');
};
