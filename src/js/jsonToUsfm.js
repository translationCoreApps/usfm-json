import * as USFM from './USFM';

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} wordObject - word in JSON
 * @return {String} - word in USFM
 */
export const generateWord = wordObject => {
  const keys = Object.keys(wordObject);
  let attributes = [];
  const word = wordObject.word;
  keys.forEach(function(key) {
    if ((key !== 'word') && (key !== 'tag')) {
      let prefix = (key === 'lemma' || key === 'strongs') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
  return line;
};

/**
 * @description convert usfm marker to string
 * @param {String} tag - tag for usfm marker
 * @param {String} number - optional number (as a string) for tag
 * @param {String} context - optional content text for marker
 * @param {String} nextText - optional text that is next entry.  Used to determine if we need to add a space between
 *                              tag and text
 * @return {String} Text equivalent of marker.
 */
export const usfmMarkerToString = (tag, number, context, nextText) => {
  let output = '\\' + tag;
  if (number) {
    output += ' ' + number;
  }

  if (nextText && (nextText[0] !== '\n') && USFM.markerHasNoContent(tag)) {
    output += ' ';
  } else if (context && (context[0] !== '\n')) {
    output += ' ';
  }

  if (context) {
    output += context;
  }
  return output;
};

/**
 * @description Identifies type of
 * @param {string|array|object} object - marker to print
 * @param {String} nextObject - optional object that is next entry.  Used to determine if we need to add a space
 *                              between current marker and following text
 * @return {String} Text equivalent of marker.
 */
export const objectToString = (object, nextObject) => {
  if (!object) {
    return "";
  }

  if (typeof object === 'string') {
    return object;
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

  if (object['word']) { // usfm word marker
    return exports.generateWord(object);
  }

  if (object['tag']) { // any other USFM marker tag
    const output = usfmMarkerToString(object.tag, object.number, object.content,
      nextObject);
    return output;
  }
  return "";
};

/**
 * @description Takes in verse json and outputs it as a USFM line array.
 * @param {int} verseNumber - number to use for the verse
 * @param {Array} verseArray - verse in JSON
 * @return {Array} - verse in USFM lines/string
 */
export const generateVerse = (verseNumber, verseArray) => {
  const verseText = objectToString(verseArray);
  return usfmMarkerToString('v', verseNumber, verseText);
};

/**
 * @description Takes in chapter json and outputs it as a USFM line array.
 * @param {int} chapterNumber - number to use for the chapter
 * @param {Object} chapterObject - chapter in JSON
 * @return {Array} - chapter in USFM lines/string
 */
export const generateChapterLines = (chapterNumber, chapterObject) => {
  let lines = [];
  lines.push('\\c ' + chapterNumber + '\n');
  lines.push('\\p\n');
  const verseNumbers = Object.keys(chapterObject);
  verseNumbers.forEach(function(verseNumber) {
    const verseArray = chapterObject[verseNumber];
    const verseLine = exports.generateVerse(verseNumber, verseArray);
    lines = lines.concat(verseLine);
  });
  return lines;
};

/**
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
 */
export const jsonToUSFM = json => {
  USFM.init();
  let output = [];
  if (json.headers) {
    const keys = Object.keys(json.headers);
    keys.forEach(function(key) {
      const value = json.headers[key];
      output.push(usfmMarkerToString(key, '', value + '\n'));
    });
  }
  if (json.chapters) {
    const chapterNumbers = Object.keys(json.chapters);
    chapterNumbers.forEach(function(chapterNumber) {
      const chapterObject = json.chapters[chapterNumber];
      const chapterLines = exports.generateChapterLines(
          chapterNumber, chapterObject,
      );
      output = output.concat(chapterLines);
    });
  }
  if (json.verses) {
    const verseNumbers = Object.keys(json.verses);
    verseNumbers.forEach(function(verseNumber) {
      const verseObject = json.verses[verseNumber];
      const verse = exports.generateVerse(
          verseNumber, verseObject,
      );
      output = output.push(verse);
    });
  }
  return output.join('');
};
