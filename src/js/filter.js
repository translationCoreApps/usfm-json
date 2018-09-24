/* eslint-disable no-use-before-define */
import {usfmToJSON} from './usfmToJson';

/* Method to filter specified usfm marker from a string
 * @param {string} string - The string to remove specfic marker from
 * @return {string}
 */
export const removeMarker = (string = '') => {
  let output = string; // default results
  if (string) {
    const testData = convertStringToVerseObjects(string);
    if (testData) {
      output = mergeVerseData(testData); // get displayed text from verseObjects
    }
  }
  return output;
};

/**
 * takes the text of a verse and converts to verseObjects
 * @param {String} text - verse text to convert
 * @return {Object|*} verseObjects for verseText
 */
export const convertStringToVerseObjects = text => {
// first parse to verse objects
  const verseObjects = usfmToJSON('\\v 1 ' + text, {chunk: true});
  const verseText = verseObjects && verseObjects.verses["1"] && verseObjects.verses["1"].verseObjects;
  return verseText;
};

/**
 * extracts word objects from verse object. If verseObject is word type, return that in array, else if it is a
 * milestone, then add words found in children to word array.  If no words found return empty array.
 * @param {object} verseObject - verse objects to have words extracted from
 * @return {Array} words found
 */
export const extractWordsFromVerseObject = verseObject => {
  let words = [];
  if (typeof verseObject === 'object') {
    if (verseObject.word || verseObject.type === 'word') {
      words.push(verseObject);
    } else if (verseObject.type === 'milestone' && verseObject.children) {
      for (let child of verseObject.children) {
        const childWords = extractWordsFromVerseObject(child);
        words = words.concat(childWords);
      }
    }
  }
  return words;
};

/**
 * @description merge verse data into a string
 * @param {Object|Array} verseData - verse objects to be merged
 * @param {array} filter - Optional filter to get a specific type of word object type.
 * @return {String} - the merged verse object string
 */
export const mergeVerseData = (verseData, filter) => {
  if (verseData.verseObjects) {
    verseData = verseData.verseObjects;
  }
  const verseArray = [];
  verseData.forEach(part => {
    if (typeof part === 'string') {
      verseArray.push(part);
    }
    let words = [part];
    if (part.type === 'milestone') {
      words = extractWordsFromVerseObject(part);
    }
    words.forEach(word => {
      if (!filter || (word.text && word.type && filter.includes(word.type))) {
        verseArray.push(word.text);
      }
    });
  });
  let verseText = '';
  for (let verse of verseArray) {
    if (verse) {
      if (verseText && (verseText[verseText.length - 1] !== '\n')) {
        verseText += ' ';
      }
      verseText += verse;
    }
  }
  return verseText;
};
