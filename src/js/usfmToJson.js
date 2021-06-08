/* eslint-disable no-use-before-define,no-negated-condition,brace-style */
/**
 * @description for converting from USFM to json format.  Main method is usfmToJSON()
 */

import { Proskomma } from 'proskomma';
import { parseProskommaToTcore } from "./parseProskomma";

/**
 * @description - Parses the usfm string and returns an object
 * @param {String} usfm - the raw usfm string
 * @param {Object} params - extra params to use for chunk parsing. Properties:
 *                    chunk {boolean} - if true then output is just a small piece of book
 *                    content-source {String} - content source attribute to add to word imports
 *                    convertToInt {Array} - attributes to convert to integer
 * @return {Object} - json object that holds the parsed usfm data, headers and chapters
*/
export const usfmToJSON = async (usfm, params = {}) => {
  // const lines = usfm.split(/\r?\n/); // get all the lines
  // const usfmJSON = {};
  // const markers = [];
  // const lastLine = lines.length - 1;
  // for (let l = 0; l < lines.length; l++) {
  //   const parsedLine = parseLine(lines[l], l >= lastLine);
  //   markers.push.apply(markers, parsedLine); // fast concat
  // }
  // const state = {
  //   currentChapter: 0,
  //   currentVerse: 0,
  //   chapters: {},
  //   verses: {},
  //   headers: [],
  //   nested: [],
  //   phrase: null,
  //   phraseParent: null,
  //   onSameChapter: false,
  //   inHeader: true,
  //   newAlignFormat: false,
  //   params: params
  // };
  // getAlignmentFormat(usfm, state);
  // for (let i = 0; i < markers.length; i++) {
  //   let marker = markers[i];
  //   switch (marker.tag) {
  //     case 'c': { // chapter
  //       if (!marker.number && marker.content) { // if no number, try to find in content
  //         extractNumberFromContent(marker);
  //       }
  //       if (marker.number) {
  //         processAsChapter(state, marker);
  //       } else { // no chapter number, add as text
  //         marker.content = markerToText(marker);
  //         processAsText(state, marker);
  //       }
  //       break;
  //     }
  //     case 'v': { // verse
  //       if (!marker.number && marker.content) { // if no number, try to find in content
  //         extractNumberFromContent(marker);
  //       }
  //       if (marker.number) {
  //         parseAsVerse(state, marker);
  //       } else { // no verse number, add as text
  //         marker.content = markerToText(marker);
  //         processAsText(state, marker);
  //       }
  //       break;
  //     }
  //     case 'k':
  //     case 'zaln': { // phrase
  //       if (state.inHeader) {
  //         addHeaderMarker(state, marker);
  //       } else {
  //         const phrase = parseWord(state, marker.content); // very similar to word marker, so start with this and modify
  //         phrase.type = "milestone";
  //         const milestone = phrase.text.trim();
  //         if (milestone === '-s') { // milestone start
  //           removeLastNewLine(state, marker.tag);
  //           delete phrase.text;
  //           i = startSpan(state, phrase, marker.tag, i, markers);
  //         } else if (milestone === '-e') { // milestone end
  //           removeLastNewLine(state, marker.tag, true);
  //           i = endSpan(state, i, markers, marker.tag + "-e\\*");
  //         } else {
  //           i = processMarkerForSpans(state, marker, i, markers); // process as regular marker
  //         }
  //       }
  //       break;
  //     }
  //     case 'w': { // word
  //       if (state.inHeader) {
  //         addHeaderMarker(state, marker);
  //       } else {
  //         handleWordWhiteSpace(state);
  //         const wordObject = parseWord(state, marker.content,
  //                                      USFM.wordSpecialAttributes);
  //         if (isNonDisplayablePhraseParent(state)) {
  //           saveUsfmObject(state, marker);
  //         } else {
  //           pushObject(state, null, wordObject);
  //           if (marker.nextChar) {
  //             pushObject(state, null, marker.nextChar);
  //           }
  //         }
  //       }
  //       break;
  //     }
  //     case 'w*': {
  //       if (state.inHeader) {
  //         addHeaderMarker(state, marker);
  //       } else {
  //         if (isNonDisplayablePhraseParent(state)) {
  //           saveUsfmObject(state, marker);
  //         } else if (marker.nextChar && (marker.nextChar !== ' ')) {
  //           pushObject(state, null, marker.nextChar);
  //         }
  //       }
  //       break;
  //     }
  //     case undefined: { // likely orphaned text for the preceding verse marker
  //       if (marker) {
  //         if (state.inHeader) {
  //           addHeaderMarker(state, marker);
  //         }
  //         else if (marker.content && (marker.content.substr(0, 2) === "\\*")) {
  //           // is part of usfm3 milestone marker
  //           marker.content = marker.content.substr(2);
  //         } else
  //         if (marker.content && (marker.content.substr(0, 1) === "*")) {
  //           const phraseParent = getPhraseParent(state);
  //           if (phraseParent && (phraseParent.usfm3Milestone ||
  //               isAlignmentMarker(phraseParent))) {
  //             // is part of usfm3 milestone marker
  //             marker.content = marker.content.substr(1);
  //           }
  //         }
  //         if (marker.content) {
  //           processAsText(state, marker);
  //         }
  //       }
  //       break;
  //     }
  //     default: {
  //       const tag0 = marker.tag ? marker.tag.substr(0, 1) : "";
  //       if ((tag0 === 'v') || (tag0 === 'c')) { // check for mangled verses and chapters
  //         const number = marker.tag.substr(1);
  //         const isInt = /^\+?\d+$/.test(number);
  //         if (isInt) {
  //           // separate number from tag
  //           marker.tag = tag0;
  //           if (marker.number) {
  //             marker.content = marker.number +
  //               (marker.content ? " " + marker.content : "");
  //           }
  //           marker.number = number;
  //           if (tag0 === 'v') {
  //             parseAsVerse(state, marker);
  //             marker = null;
  //           } else if (tag0 === 'c') {
  //             processAsChapter(state, marker);
  //             marker = null;
  //           }
  //         } else if (marker.tag.length === 1) { // convert line to text
  //           marker.content = markerToText(marker);
  //           processAsText(state, marker);
  //           marker = null;
  //         }
  //       }
  //       if (marker) { // if not yet processed
  //         i = processMarker(state, marker, i, markers);
  //       }
  //     }
  //   }
  // }
  // terminatePhrases(state);
  // cleanupHeaderNewLines(state);

  const pk = new Proskomma();
//try {
  let selectors = {
    lang: { name: 'eng' },
    abbr: { name: 'eng' },
  };

  const contentType = 'usfm';
  const getChaptersQuery = `{ documents { bookCode: header(id:"bookCode") cvIndexes { chapter verseNumbers { number range } verseRanges { range numbers } } } }`;

  pk.importDocument(
    selectors,
    contentType,
    usfm
    // {includeScopes: ['chapter/','verse/']}
  );

  const chapterResults = await pk.gqlQuery(getChaptersQuery);
  // console.log(JSON.stringify(output, null, 2))
  const doc1 = chapterResults?.data?.documents?.[0];
  const bookId = doc1?.bookCode;
  const indices = doc1?.cvIndexes;
  console.log(bookId);
  const chapters = indices.map(item => item?.chapter);
  // console.log(chapters);
  const content = await getChapters(pk, bookId, chapters);
  parseProskommaToTcore(content);
  console.log(content);
  // fse.writeJsonSync('./book_content.json', content);

  const headers = {};

  const usfmJSON = {
    headers,
    chapters: content,
  };
  // getVerseObjectsForBook(usfmJSON, state);
  // if (Object.keys(state.verses).length > 0) {
  //   usfmJSON.verses = getVerseObjectsForChapter(state.verses);
  // }
  return usfmJSON;
};

async function getChapters(pk, bookId, chapters) {
  if (bookId) {
    const contents = {};

    for (const c of chapters) {
      // eslint-disable-next-line no-await-in-loop
      contents[c] = await getChapter(pk, bookId, c);
    }
    // console.log(JSON.stringify(contents, null, 2))
    return contents;
  }
  return null;
}

async function getChapter(pk, bookId, chapter) {
  // query chapter by block
//   const chapterQuery = `{ documents
//   {
//     mainSequence {
//       blocks(withScriptureCV: "${chapter}") {
//         bs { payload }
//         items { type subType payload }
//       }
//     }
//   }
// }`;
  // query chapter, return everything (items)
  const chapterQuery = `{ documents
  {
    cv (chapter:"${chapter}") {
      items { type subType payload }
    }
  }
}`;
  // const output = `${bookId} - ${chapters}`;
  const chapterData = await pk.gqlQuery(chapterQuery);
  return chapterData;
  // const results = makeNestedView(chapterData);
  // const tC_Data = convertToTcore(results);
  // // console.log(JSON.stringify(output, null, 2))
  // return tC_Data;
}
