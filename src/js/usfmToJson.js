/**
 * @author unfoldingword
 * @description takes in usfm file as string
 * @param {string} usfmInput - A string in the USFM format
 * @return {Object} - An object that contains the scripture.
 */

exports.getMatches = function(string, regex, index) {
  // regex must be global /.../g
  var matches = [];
  var match;
  if (string.match(regex)) {
    while (match = regex.exec(string)) {
      matches.push(match);
    }
  }
  return matches;
}

exports.parseMarkerOpen = function(markerOpen) {
  const regex = /(\w+)\s*(\d*)/g;
  const matches = exports.getMatches(markerOpen, regex);
  const object = {
    type: matches[0][1],
    number: matches[0][2]
  };
  return object;
};

exports.parseWord = function(wordContent) {
  const wordParts = wordContent.split('|');
  const word = wordParts[0];
  const attributeContent = wordParts[1];
  const wordObject = {
    word: word
  };
  const regex = /[x-]*([\w-]+)=['"](.*?)['"]/g;
  const matches = exports.getMatches(attributeContent, regex);
  matches.forEach(function(match) {
    const key = match[1];
    const value = match[2];
    wordObject[key] = value;
  });
  return wordObject;
};

exports.parseLine = function(line) {
  let array = []; // = [ { marker: undefined, text: undefined } ]
  const regex = (/\\(\w+\s*\d*)\s*([^\\]+)?(\\\w\*)?/g);
  const matches = exports.getMatches(line, regex);
  if (matches) {
    matches.forEach(function(match) {
      const object = {
        open: match[1].trim(),
        content: match[2],
        close: match[3]
      };
      array.push(object);
    });
  }
  return array;
};

exports.parseUSFM = function(usfm) {
  const lines = usfm.match(/.*/g); // get all the lines
  let usfmJSON = {};
  let markerObjects = [];
  lines.forEach(function(line) {
    const parsedLine = exports.parseLine(line);
    markerObjects = markerObjects.concat(parsedLine);
  });
  let currentMarker = {};
  let currentChapter = 0;
  let currentVerse = 0;
  let chapters = {};
  let headers = {};
  markerObjects.forEach(function(markerObject) {
    let marker = exports.parseMarkerOpen(markerObject.open);
    if (marker.type) currentMarker = marker;
    switch (marker.type) {
      case 'c': // chapter
        currentChapter = marker.number;
        chapters[currentChapter] = {};
        break;
      case 'v': // verse
        currentVerse = marker.number;
        chapters[currentChapter][currentVerse] = [];
        if (markerObject.content) {
          chapters[currentChapter][currentVerse].push(markerObject.content);
        }
        break;
      case 'w': // word
        const wordObject = exports.parseWord(markerObject.content);
        chapters[currentChapter][currentVerse].push(wordObject);
        break;
      case undefined:
        if (currentChapter > 0 && currentVerse > 0 && markerObject.content) {
          chapters[currentChapter][currentVerse].push(markerObject.content);
        }
        break;
      default:
        if (currentChapter === 0) { // if we haven't seen chapter yet, its a header
          let value;
          if (marker.number) { // if there is a number, prepend it to content
            value = marker.number + ' ' + markerObject.content;
          } else {
            value = markerObject.content;
          }
          headers[marker.type] = value;
        }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  return usfmJSON;
};

exports.usfmToJSON = function(usfm) {
  return exports.parseUSFM(usfm);
};
