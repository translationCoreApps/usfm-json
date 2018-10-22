/* eslint-disable no-use-before-define,brace-style */
import _ from "lodash";
import {usfmToJSON} from './usfmToJson';
import {jsonToUSFM} from './jsonToUsfm';

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
 * dive down into milestone to extract words and text
 * @param {Object} verseObject - milestone to parse
 * @return {string} text content of milestone
 */
const parseMilestone = verseObject => {
  let text = verseObject.text || "";
  let wordSpacing = '';
  const length = verseObject.children.length;
  for (let i = 0; i < length; i++) {
    let child = verseObject.children[i];
    switch (child.type) {
      case 'word':
        text += wordSpacing + child.text;
        wordSpacing = ' ';
        break;

      case 'milestone':
        text += wordSpacing + parseMilestone(child);
        wordSpacing = ' ';
        break;

      default:
        if (child.text) {
          text += child.text;
          const lastChar = text.substr(-1);
          if ((lastChar !== ",") && (lastChar !== '.') && (lastChar !== '?') && (lastChar !== ';')) { // legacy support, make sure padding before word
            wordSpacing = '';
          }
        }
        break;
    }
    if (child.nextChar) {
      text += child.nextChar;
    }
  }
  if (verseObject.nextChar) {
    text += verseObject.nextChar;
  }
  return text;
};

/**
 * get text from word and milestone markers
 * @param {Object} verseObject - to parse
 * @param {String} wordSpacing - spacing to use before next word
 * @return {*} new verseObject and word spacing
 */
const replaceWordsAndMilestones = (verseObject, wordSpacing) => {
  let text = '';
  if (verseObject.type === 'word') {
    text = wordSpacing + verseObject.text;
  } else if (verseObject.children) {
    text = wordSpacing + parseMilestone(verseObject);
  }
  if (text) { // replace with text object
    verseObject = {
      type: "text",
      text
    };
    wordSpacing = ' ';
  } else {
    wordSpacing = ' ';
    if (verseObject.nextChar) {
      wordSpacing = ''; // no need for spacing before next word if this item has it
    }
    else if (verseObject.text) {
      const lastChar = verseObject.text.substr(-1);
      if (![',', '.', '?', ';'].includes(lastChar)) { // legacy support, make sure padding before next word if punctuation
        wordSpacing = '';
      }
    }
    if (verseObject.children) { // handle nested
      const verseObject_ = _.cloneDeep(verseObject);
      let wordSpacing_ = '';
      const length = verseObject.children.length;
      for (let i = 0; i < length; i++) {
        const flattened =
          replaceWordsAndMilestones(verseObject.children[i], wordSpacing_);
        wordSpacing_ = flattened.wordSpacing;
        verseObject_.children[i] = flattened.verseObject;
      }
      verseObject = verseObject_;
    }
  }
  return {verseObject, wordSpacing};
};

/**
 * convert verseObjects to Text
 * @param {Array} verseObjects - to convert
 * @return {string} converted text
 */
export const verseObjectsToText = verseObjects => {
  const outputData = {
    chapters: {},
    headers: [],
    verses: {
      1: verseObjects
    }
  };
  const USFM = jsonToUSFM(outputData, {chunk: true});
  let split = USFM.split("\\v 1 ");
  if (split.length <= 1) {
    split = USFM.split("\\v 1");
  }
  return split.length > 1 ? split[1] : "";
};

/**
 * @description merge verse data into a string
 * @param {Object|Array} verseData - verse objects to be merged
 * @param {array} filter - Optional filter to get a specific type of word object type.
 * @return {String} - the merged verse object string
 */
export const mergeVerseData = verseData => {
  if (verseData.verseObjects) {
    verseData = verseData.verseObjects;
  }
  const flattenedData = [];
  if (Array.isArray(verseData)) {
    let wordSpacing = '';
    const length = verseData.length;
    for (let i = 0; i < length; i++) {
      const verseObject = verseData[i];
      const flattened = replaceWordsAndMilestones(verseObject, wordSpacing);
      wordSpacing = flattened.wordSpacing;
      flattenedData.push(flattened.verseObject);
    }
    verseData = { // use flattened data
      verseObjects: flattenedData
    };
  }
  let verseText = "";
  let length = flattenedData.length;
  for (let i = 0; i < length; i++) {
    const verseObj = flattenedData[i];
    if (verseObj.text) {
      if (verseObj.tag) {
        const lastChar = verseText && verseText[verseText.length - 1];
        if (!['', ' ', '\n'].includes(lastChar)) {
          verseText += ' ';
        }
      }
      verseText += verseObj.text;
    }
    if (verseObj.nextChar) {
      verseText += verseObj.nextChar;
    }
  }
  return verseText;
};
