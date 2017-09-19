/**
 * @description - Finds all of the regex matches in a string
 * @param {String} string - the string to find matches in
 * @param {RegExp} regex - the RegExp to find matches with, must use global flag /.../g
 * @return {Array} - array of results
*/
exports.getMatches = function(string, regex) {
  let matches = [];
  let match;
  if (string.match(regex)) { // check so you don't get caught in a loop
    while ((match = regex.exec(string))) {
      matches.push(match);
    }
  }
  return matches;
};
/**
 * @description - Parses the marker that opens and describes content
 * @param {String} markerOpen - the string that contains the marker '\v 1', '\p', ...
 * @return {Object} - the object of type and number if it exists
*/
exports.parseMarkerOpen = function(markerOpen) {
  let object = {};
  if (markerOpen) {
    const regex = /(\w+)\s*(\d*)/g;
    const matches = exports.getMatches(markerOpen, regex);
    object = {
      type: matches[0][1],
      number: matches[0][2]
    };
  }
  return object;
};
/**
 * @description - Parses the word marker into JSON
 * @param {String} wordContent - the string to find the data/attributes
 * @return {Object} - json object of the word attributes
*/
exports.parseWord = function(wordContent) {
  let object = {};
  const wordParts = wordContent.split('|');
  const word = wordParts[0];
  const attributeContent = wordParts[1];
  object = {
    word: word
  };
  const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
  const matches = exports.getMatches(attributeContent, regex);
  matches.forEach(function(match) {
    const key = match[1];
    const value = match[2];
    object[key] = value;
  });
  return object;
};
/**
 * @description - Parses the line and determines what content is in it
 * @param {String} line - the string to find the markers and content
 * @return {Array} - array of objects that describe open/close and content
*/
exports.parseLine = function(line) {
  let array = []; // = [ { marker: undefined, text: undefined } ]
  if (line.trim() === '') return array;
  const regex = /\\(\w+\s*\d*)\s*([^\\]+)?(\\\w\*)?/g;
  const matches = exports.getMatches(line, regex);
  if (regex.exec(line)) { // normal formatting with marker followed by content
    matches.forEach(function(match) {
      const open = match[1] ? match[1].trim() : undefined;
      const content = match[2] ? match[2].trim() : undefined;
      const close = match[3] ? match[3].trim() : undefined;
      let marker = exports.parseMarkerOpen(open);
      const object = {
        open: open,
        type: marker.type,
        number: marker.number,
        content: content,
        close: close
      };
      array.push(object);
    });
  } else { // doesn't have a marker but may have content
    const object = {
      open: undefined, type: undefined, number: undefined, close: undefined,
      content: line
    };
    array.push(object);
  }
  return array;
};
/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
exports.parseUSFM = function(usfm, params = {}) {
  const lines = usfm.match(/.*/g); // get all the lines
  let usfmJSON = {};
  let markers = [];
  lines.forEach(function(line) {
    const parsedLine = exports.parseLine(line);
    markers = markers.concat(parsedLine);
  });
  let currentChapter = 0;
  let currentVerse = 0;
  let chapters = {};
  let headers = {};
  if (params.chapter) {
    currentChapter = params.chapter;
    chapters[currentChapter] = {};
  }
  markers.forEach(function(marker) {
    switch (marker.type) {
      case 'c': { // chapter
        currentChapter = marker.number;
        chapters[currentChapter] = {};
        break;
      }
      case 'v': { // verse
        currentVerse = marker.number;
        chapters[currentChapter][currentVerse] = [];
        if (marker.content) {
          chapters[currentChapter][currentVerse].push(marker.content);
        }
        break;
      }
      case 'w': { // word
        const wordObject = exports.parseWord(marker.content);
        chapters[currentChapter][currentVerse].push(wordObject);
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (currentChapter > 0 && currentVerse > 0 && marker.content) {
          chapters[currentChapter][currentVerse].push(marker.content);
        }
        break;
      }
      default: {
        if (currentChapter === 0) { // if we haven't seen chapter yet, its a header
          let value;
          if (marker.number) { // if there is a number, prepend it to content
            value = marker.number + ' ' + marker.content;
          } else {
            value = marker.content;
          }
          headers[marker.type] = value;
        }
      }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  return usfmJSON;
};
/**
 * @description takes in usfm file as string
 * @param {string} usfm - A string in the USFM format
 * @param {Object} params - extra params to use for chunk parsing
 * @return {Object} - An object that contains the scripture.
 */
exports.usfmToJSON = function(usfm, params = {}) {
  return exports.parseUSFM(usfm, params);
};
