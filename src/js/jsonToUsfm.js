/**
 * @description Takes in word json and outputs it as a USFM line.
 * @param {Object} wordObject - word in JSON
 * @return {String} - word in USFM
*/
exports.generateWordLine = function(wordObject) {
  let line;
  const keys = Object.keys(wordObject);
  let attributes = [];
  const word = wordObject.word;
  keys.forEach(function(key) {
    if (key !== 'word') {
      let prefix = (key === 'lemma' || key === 'strongs') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
  return line;
};
/**
 * @description Takes in verse json and outputs it as a USFM line array.
 * @param {Int} verseNumber - number to use for the verse
 * @param {Array} verseArray - verse in JSON
 * @return {Array} - verse in USFM lines/string
*/
exports.generateVerseLines = function(verseNumber, verseArray) {
  let lines = [];
  if (typeof verseArray[0] === 'string') {
    const verseText = verseArray.join(' ');
    lines.push('\\v ' + verseNumber + ' ' + verseText);
  } else if (verseArray[0] && verseArray[0].word) {
    lines.push('\\v ' + verseNumber);
    verseArray.forEach(function(wordObject) {
      let wordLine = exports.generateWordLine(wordObject);
      lines.push(wordLine);
    });
  }
  return lines;
};
/**
 * @description Takes in chapter json and outputs it as a USFM line array.
 * @param {Int} chapterNumber - number to use for the chapter
 * @param {Object} chapterObject - chapter in JSON
 * @return {Array} - chapter in USFM lines/string
*/
exports.generateChapterLines = function(chapterNumber, chapterObject) {
  let lines = [];
  lines.push('\\c ' + chapterNumber);
  lines.push('\\p');
  const verseNumbers = Object.keys(chapterObject);
  verseNumbers.forEach(function(verseNumber) {
    const verseArray = chapterObject[verseNumber];
    const verseLines = exports.generateVerseLines(verseNumber, verseArray);
    lines = lines.concat(verseLines);
  });
  return lines;
};
/**
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
*/
exports.jsonToUSFM = function(json) {
  var lines = [];
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
        chapterNumber, chapterObject
      );
      lines = lines.concat(chapterLines);
    });
  }
  if (json.verses) {
    const verseNumbers = Object.keys(json.verses);
    verseNumbers.forEach(function(verseNumber) {
      const verseObject = json.verses[verseNumber];
      const verseLines = exports.generateVerseLines(
        verseNumber, verseObject
      );
      lines = lines.concat(verseLines);
    });
  }
  return lines.join('\n');
};
