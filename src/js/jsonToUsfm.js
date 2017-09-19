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
        const verseArray = chapter[verseNumber];
        if (typeof verseArray[0] === 'string') {
          const verseText = verseArray.join(' ');
          final.push('\\v ' + verseNumber + ' ' + verseText);
        } else if (verseArray[0].word) {
          final.push('\\v ' + verseNumber);
          verseArray.forEach(function(wordObject) {
            const keys = Object.keys(wordObject);
            let attributes = [];
            const word = wordObject.word;
            keys.forEach(function(key) {
              if (key !== 'word') {
                let prefix = (key === 'lemma' || key === 'strongs') ? '' : 'x-';
                let attribute = prefix + key + '="' + wordObject[key] + '"';
                attributes.push(attribute);
              }
            });
            final.push('\\w ' + word + '|' + attributes.join(' ') + '\\w*');
          });
        }
      });
    });
  }
  return final.join('\n');
};
