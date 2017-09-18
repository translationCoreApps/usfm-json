/** ***********************************************************************
 * @author unfoldingword
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
*/
exports.jsonToUSFM = function(json) {
  var final = [];
  if (json.headers) {
    const keys = Object.keys(json.headers);
    keys.forEach(function(key) {
      const value = json.headers[key];
      final.push('\\' + key + ' ' + value);
    });
  }
  if (json.chapters) {
    const chapterNumbers = Object.keys(json.chapters);
    chapterNumbers.forEach(function(chapterNumber) {
      final.push('\\c ' + chapterNumber);
      final.push('\\p');
      const chapter = json.chapters[chapterNumber];
      const verseNumbers = Object.keys(chapter);
      verseNumbers.forEach(function(verseNumber) {
        const verseText = chapter[verseNumber];
        final.push('\\v ' + verseNumber + ' ' + verseText);
      });
    });
  }
  return final.join('\n');
};
