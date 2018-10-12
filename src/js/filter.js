/* eslint-disable no-use-before-define */
import {usfmToJSON} from './usfmToJson';

/* Method to filter specified usfm marker from a string
 * @param {string} string - The string to remove specfic marker from
 * @return {string}
 */
export const removeMarker = (string = '') => {
  let output = string; // default results
  if (string) {
    const verseObjects = convertStringToVerseObjects(string);
    if (verseObjects) {
      output = mergeVerseData(verseObjects); // get displayed text from verseObjects
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
  const jsonData = usfmToJSON('\\v 1 ' + text, {chunk: true});
  const verseObjects = jsonData && jsonData.verses && jsonData.verses["1"] && jsonData.verses["1"].verseObjects;
  return verseObjects;
};

/**
 * extracts text objects within verse object. If verseObject is word type, return that in array, else if it is a
 * milestone, then add words found in children to word array.  If no words found return empty array.
 * @param {object} verseObject - verse objects to have words extracted from
 * @return {Array} verseObjects found
 */
export const extractTextFromVerseObject = verseObject => {
  let verseObjects = [];
  if (typeof verseObject === 'object') {
    if (verseObject.text) {
      verseObjects.push({type: 'text', text: verseObject.text});
    }
    if (verseObject.word || verseObject.type === 'word') {
      verseObjects.push(verseObject);
    } else if (verseObject.children) {
      for (let child of verseObject.children) {
        const childWords = extractTextFromVerseObject(child);
        verseObjects = verseObjects.concat(childWords);
        if (child.nextChar) {
          verseObjects.push({type: 'text', text: child.nextChar});
        }
      }
    }
  }
  return verseObjects;
};

/**
 * @description merge verse data into a string
 * @param {Object|Array} verseData - verse objects to be merged
 * @param {array} filter - Optional filter to get a specific type of word object type.
 * @return {String} - the merged verse object string
 */
export const mergeVerseData = verseData => {
  const verseArray = [];
  let length = verseData.length;
  for (let i = 0; i < length; i++) {
    const part = verseData[i];
    if (typeof part === 'string') {
      verseArray.push(part);
      continue;
    }
    let verseObjects = [part];
    if (part.children) {
      verseObjects = extractTextFromVerseObject(part);
    }
    const voLength = verseObjects.length;
    for (let w = 0; w < voLength; w++) {
      const word = verseObjects[w];
      if (word.text) {
        verseArray.push(word.text);
      }
    }
    if (part.nextChar) {
      verseArray.push(part.nextChar);
    }
  }
  let verseText = '';
  length = verseArray.length;
  for (let i = 0; i < length; i++) {
    const verse = verseArray[i];
    if (verse) {
      if (verseText) {
        // make sure words aren't crammed together
        const lastChar = verseText.substr(verseText.length - 1);
        if ((lastChar !== '\n') && (lastChar !== ' ')) {
          const nextChar = verse[0];
          if ((nextChar !== '\n') && (nextChar !== ' ')) {
            verseText += ' ';
          }
        }
      }
      verseText += verse;
    }
  }
  return verseText;
};
