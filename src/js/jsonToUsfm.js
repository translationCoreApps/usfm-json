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
    if((key !== 'word') && (key !== 'type')) {
      let prefix = (key === 'lemma' || key === 'strongs') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
  return line;
};

function objectToString(object) {
  if(!object) {
    return "";
  }

  if (typeof object === 'string') {
    return object;
  }

  if (Array.isArray(object)) {
    let output = "";
    for(let item of object) {
      let text = objectToString(item);
      if(text){
        output += text;
      }
    }
    return output;
  }

  if(object['word']) {
    return exports.generateWord(object);
  }

  if(object['type']) {
    let output = '\\' + object['type'] + ' ';
    if(object['number']) {
      output += object['number'] + ' ';
    }
    output += objectToString(object['content']);
    return output;
  }
  return "";
}

/**
 * @description Takes in verse json and outputs it as a USFM line array.
 * @param {int} verseNumber - number to use for the verse
 * @param {Array} verseArray - verse in JSON
 * @return {Array} - verse in USFM lines/string
 */
export const generateVerse = (verseNumber, verseArray) => {
  const verseText = objectToString(verseArray);
  return '\\v ' + verseNumber + ' ' + verseText;
};

/**
 * @description Takes in chapter json and outputs it as a USFM line array.
 * @param {int} chapterNumber - number to use for the chapter
 * @param {Object} chapterObject - chapter in JSON
 * @return {Array} - chapter in USFM lines/string
 */
export const generateChapterLines = (chapterNumber, chapterObject) => {
  let lines = [];
  lines.push('\\c ' + chapterNumber);
  lines.push('\\p');
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
  let lines = [];
  if (json.headers) {
    const keys = Object.keys(json.headers);
    keys.forEach(function(key) {
      const value = json.headers[key];
      lines.push('\\' + key + ' ' + value);
    });
  }
  if (json.chapters) {
    const chapterNumbers = Object.keys(json.chapters);
    chapterNumbers.forEach(function(chapterNumber) {
      const chapterObject = json.chapters[chapterNumber];
      const chapterLines = exports.generateChapterLines(
          chapterNumber, chapterObject,
      );
      lines = lines.concat(chapterLines);
    });
  }
  if (json.verses) {
    const verseNumbers = Object.keys(json.verses);
    verseNumbers.forEach(function(verseNumber) {
      const verseObject = json.verses[verseNumber];
      const verse = exports.generateVerse(
          verseNumber, verseObject,
      );
      lines = lines.push(verse);
    });
  }
  return lines.join('\n');
};
