import * as USFM from './USFM';

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} wordObject - word in JSON
 * @return {String} - word in USFM
 */
export const generateWord = wordObject => {
  const keys = Object.keys(wordObject);
  let attributes = [];
  const word = wordObject.text;
  keys.forEach(function(key) {
    if ((key !== 'text') && (key !== 'tag') && (key !== 'type')) {
      let prefix = (key === 'lemma' || key === 'strong') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
  return line;
};

/**
 * @description Takes in word json and outputs it as USFM.
 * @param {Object} phraseObject - word in JSON
 * @return {String} - word in USFM
 */
export const generatePhrase = phraseObject => {
  const keys = Object.keys(phraseObject);
  let attributes = [];
  keys.forEach(function(key) {
    if ((key !== 'children') && (key !== 'tag') && (key !== 'type')) {
      let prefix = 'x-';
      let attribute = prefix + key + '="' + phraseObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\k-s | ' + attributes.join(' ') + '\n';

/* eslint-disable no-use-before-define */
  let text = objectToString(phraseObject.children);
/* eslint-enable no-use-before-define */
  line += text;
  line += "\\k-e\\*";
  return line;
};

/**
 * @description convert usfm marker to string
 * @param {object} usfmObject - usfm object to output
 * @return {String} Text equivalent of marker.
 */
export const usfmMarkerToString = usfmObject => {
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
 * @param {String} nextObject - optional object that is next entry.  Used to determine if we need to add a space
 *                              between current marker and following text
 * @return {String} Text equivalent of marker.
 */
export const objectToString = (object, nextObject) => {
  if (!object) {
    return "";
  }

  if (object.type === 'text') {
    return object.text;
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
    return generateWord(object);
  }

  if (object.type === 'keyterm') { // usfm keyterm with milestone (phrase)
    return generatePhrase(object);
  }

  if (object.tag) { // any other USFM marker tag
    return usfmMarkerToString(object);
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
  const object = {
    tag: 'v',
    number: verseNumber,
    text: verseText
  };
  return usfmMarkerToString(object);
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
    const verseArray = chapterObject[verseNumber];
    const verseLine = generateVerse(verseNumber, verseArray);
    lines = lines.concat(verseLine);
  });
  return lines;
};

/**
 * @description convert object to text and add to array.  Objects are terminated with newline
 * @param {array} output - array where text is appended
 * @param {Object} usfmObject - USFM object to convert to string
 */
export const outputHeaderObject = (output, usfmObject) => {
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
export const jsonToUSFM = json => {
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
      const verseObject = json.verses[verseNumber];
      const verse = generateVerse(
          verseNumber, verseObject,
      );
      output = output.concat(verse);
    });
  }
  return output.join('');
};
