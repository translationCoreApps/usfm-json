import * as USFM from './USFM'

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
    if((key !== 'word') && (key !== 'tag')) {
      let prefix = (key === 'lemma' || key === 'strongs') ? '' : 'x-';
      let attribute = prefix + key + '="' + wordObject[key] + '"';
      attributes.push(attribute);
    }
  });
  let line = '\\w ' + word + '|' + attributes.join(' ') + '\\w*';
  return line;
};

/**
 * convert usfm tag to string
 * @param tag
 * @param number
 * @param text
 * @return {string}
 */
export const usfmMarkerToString = (tag, number, text, nextText) => {
  let output = '\\' + tag;
  if(number) {
    output += ' ' + number;
  }

  if(nextText && (nextText[0] !== '\n') && USFM.markerHasNoContent(tag)) {
    output += ' ';
  }
  else if(text && (text[0] !== '\n')) {
    output += ' ';
  }

  if(text) {
    output += text;
  }
  return output;
};

/**
 *
 * @param item
 * @return {*}
 */
export const objectToString = (item, nextItem) => {
  if(!item) {
    return "";
  }

  if (typeof item === 'string') {
    return item;
  }

  if (Array.isArray(item)) {
    let output = "";
    for(let i=0; i<item.length; i++) {
      const itemN = item[i];
      const nextItem = (i+1<item.length) ? item[i+1] : null;
      let text = objectToString(itemN, nextItem);
      if(text){
        output += text;
      }
    }
    return output;
  }

  if(item['word']) {
    return exports.generateWord(item);
  }

  if(item['tag']) {
    let output = usfmMarkerToString(item.tag, item.number, item.content, nextItem);
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
