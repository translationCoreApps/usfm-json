/**
 * @description - Finds all of the regex matches in a string
 * @param {String} string - the string to find matches in
 * @param {RegExp} regex - the RegExp to find matches with, must use global flag /.../g
 * @return {Array} - array of results
*/
export const getMatches = (string, regex) => {
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
export const parseMarkerOpen = markerOpen => {
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
export const parseWord = wordContent => {
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
    object[match[1]] = match[2];
  });
  return object;
};

/**
 * @description - Parses the line and determines what content is in it
 * @param {String} line - the string to find the markers and content
 * @return {Array} - array of objects that describe open/close and content
*/
export const parseLine = line => {
  let array = [];
  if (line.trim() === '') {
    return array;
  }
  const regex = /([^\\]+)?\\(\w+\s*\d*)(?!\w)\s*([^\\]+)?(\\\w\*)?/g;
  const matches = exports.getMatches(line, regex);
  if (regex.exec(line)) { // normal formatting with marker followed by content
    matches.forEach(function(match) {
      const orphan = match[1] ? match[1].trim() : undefined;
      if (orphan) {
        const object = {content: orphan};
        array.push(object);
      }
      const open = match[2] ? match[2].trim() : undefined;
      const content = match[3] ? match[3].trim() : undefined;
      const close = match[4] ? match[4].trim() : undefined;
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
    // this is considered an orphaned line
    const orphan = line.trim();
    const object = {
      open: undefined, type: undefined, number: undefined, close: undefined,
      content: orphan
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
export const usfmToJSON = (usfm, params = {}) => {
  const lines = usfm.match(/.*/g); // get all the lines
  let usfmJSON = {};
  let markers = [];
  lines.forEach(function(line) {
    const parsedLine = exports.parseLine(line.trim());
    markers = markers.concat(parsedLine);
  });
  let currentChapter = 0;
  let currentVerse = 0;
  let chapters = {};
  let verses = {};
  let headers = {};
  let onSameChapter = false;
  markers.forEach(function(marker) {
    switch (marker.type) {
      case 'c': { // chapter
        currentChapter = marker.number;
        chapters[currentChapter] = {};
        // resetting 'on same chapter' flag
        onSameChapter = false;
        break;
      }
      case 'v': { // verse
        marker.content = marker.content || "";
        currentVerse = marker.number;
        if (params.chunk === true && (marker.content || marker.content === "") && !onSameChapter) {
          if (verses[currentVerse]) {
            onSameChapter = true;
            break;
          } else {
            verses[currentVerse] = [];
            verses[currentVerse].push(marker.content);
          }
        }
        if (chapters[currentChapter] && marker.content && !onSameChapter) {
          // if the current chapter exists, not on same chapter, and there is content to store
          if (chapters[currentChapter][currentVerse]) {
            // If the verse already exists, then we are flagging as 'on the same chapter'
            onSameChapter = true;
            break;
          }
          chapters[currentChapter][currentVerse] = [];
          chapters[currentChapter][currentVerse].push(marker.content);
        }
        break;
      }
      case 'w': { // word
        const wordObject = exports.parseWord(marker.content);
        if (!chapters[currentChapter][currentVerse])
          chapters[currentChapter][currentVerse] = [];
        chapters[currentChapter][currentVerse].push(wordObject);
        break;
      }
      case undefined: { // likely orphaned text for the preceding verse marker
        if (currentChapter > 0 && currentVerse > 0 && marker.content) {
          if (!chapters[currentChapter][currentVerse])
            chapters[currentChapter][currentVerse] = [];
          chapters[currentChapter][currentVerse].push(marker.content);
        }
        if (params.chunk && currentVerse > 0 && marker.content) {
          if (!verses[currentVerse])
            verses[currentVerse] = [];
          verses[currentVerse].push(marker.content);
        }
        break;
      }
      default: {
        if (currentChapter === 0 && !currentVerse) { // if we haven't seen chapter yet, its a header
          let value;
          if (marker.number) { // if there is a number, prepend it to content
            value = marker.number + ' ' + marker.content;
          } else {
            value = marker.content;
          }
          headers[marker.type] = value;
        } else if (currentChapter && currentVerse) {
          const markerType0 = marker.type.substr(0, 1);
          if (markerType0 === 'q') {
            let markerContent = '\\' + marker.type;
            markerContent += marker.content ? ' ' + marker.content : '';
            if (params.chunk) {
              verses[currentVerse].push(markerContent);
            } else {
              chapters[currentChapter][currentVerse].push(markerContent);
            }
          }
        }
      }
    }
  });
  usfmJSON.headers = headers;
  usfmJSON.chapters = chapters;
  if (Object.keys(verses).length > 0) usfmJSON.verses = verses;
  return usfmJSON;
};
