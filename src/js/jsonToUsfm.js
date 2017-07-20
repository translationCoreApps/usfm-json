/** ***********************************************************************
 * @author unfoldingword
 * @description Takes in scripture json and outputs it as a USFM string.
 * @param {Object} json - Scripture in JSON
 * @return {String} - Scripture in USFM
*/
exports.jsonToUSFM = function(json) {
  var final = [];
  if (json.book) {
    final.push('\\h ' + json.book);
  }
  if (json.id) {
    final.push('\\id ' + json.id);
  }
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
  return final.join('\n');
};
