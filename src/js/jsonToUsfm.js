/** ***********************************************************************
 * @author unfoldingword
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
*/
exports.jsonToUSFM = function (json) {
  var final = [];
  if (json.id) {
    final.push('\\id ' + json.id);
  }
  if (json.book) {
    final.push('\\h ' + json.book);
  }
  if (nestedLevel(json) == 2) {
    for (var chapter in json) {
      let chapterNumber = parseInt(chapter);
      if (!chapterNumber || chapterNumber < 1) continue;
      var currentChapter = json[chapterNumber];
      final.push('\\c ' + chapterNumber);
      final.push('\\p');
      for (var verse in currentChapter) {
        let verseNumber = parseInt(verse);
        if (!verseNumber || verseNumber < 1) continue;
        var currentVerse = currentChapter[verseNumber];
        final.push('\\v ' + verseNumber + ' ' + currentVerse);
      }
    }
  } else if (nestedLevel(json) == 1) {
    for (var verse in json) {
      let verseNumber = parseInt(verse);
      if (!verseNumber || verseNumber < 1) continue;
      var currentVerse = json[verseNumber];
      final.push('\\v ' + verseNumber + ' ' + currentVerse);
    }
  }
  return final.join('\n');
};

function nestedLevel(obj) {
  var nestedLevel = 0; 
  for (var element in obj) {
    nestedLevel = 1;
    if (typeof (obj[element]) === 'object')
      nestedLevel = 2;
  }
  return nestedLevel;
}
