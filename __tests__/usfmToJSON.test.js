/* eslint-env jest */

const fs = require('fs');
const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
// const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;

const missingVerseMarkers = '__tests__/static/missing/many_missing_verses.usfm';
const missingChapterMarkers = '__tests__/static/missing/many_missing_chapters.usfm';
const missingAChapter = '__tests__/static/missing/php_usfm_NoC2.usfm';
const outOfSequenceVerseMarkers = '__tests__/static/out_of_sequence/verse_markers.usfm';
const outOfSequenceChapterMarkers = '__tests__/static/out_of_sequence/chapter_markers.usfm';

const usfmPath = '__tests__/static/3john.usfm';
let converted;
describe('usfmToJson', () => {
  it('should return expected json data from usfm string', () => {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    converted = usfmToJson(usfm);
    expect(converted.headers).not.toBeNull();
    expect(converted.headers.h).toEqual('3 John');
    const chapter1 = converted.chapters[1];
    const verse1 = chapter1[1];
    const text = verse1[0];
    const expected = 'The elder to beloved Gaius, whom I love in truth.';
    expect(text).toEqual(expected);
  });
  it('should handle missing verse markers', () => {
    // parse valid usfm file
    const usfmFile = missingVerseMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1][3]).toBeUndefined();
    expect(usfm[1][4]).toBeUndefined();
    expect(usfm[1][21]).toEqual(['For to me to live is Christ, and to die is gain.']);
    expect(30 - Object.keys(usfm[1]).length).toEqual(2);

    expect(usfm[2][5]).toBeUndefined();
    expect(usfm[2][6]).toBeUndefined();
    expect(usfm[2][10]).toEqual(['So at the name of Jesus every knee should bow,']);
    expect(30 - Object.keys(usfm[2]).length).toEqual(2);

    expect(usfm[3][5]).toBeUndefined();
    expect(usfm[3][10]).toBeUndefined();
    expect(usfm[3][11]).toBeUndefined();
    expect(usfm[3][15]).toBeUndefined();
    expect(usfm[3][16]).toBeUndefined();
    expect(usfm[3][17]).toEqual(['Brothers, join me and imitate me, and watch closely those who are walking by our example.']);
    expect(21 - Object.keys(usfm[3]).length).toEqual(5);

    expect(usfm[4][1]).toBeUndefined();
    expect(usfm[4][21]).toBeUndefined();
    expect(usfm[4][22]).toBeUndefined();
    expect(usfm[4][4]).toEqual(['Rejoice in the Lord always; again I will say, rejoice.']);
    expect(23 - Object.keys(usfm[4]).length).toEqual(3);
  });

  it('should handle out of sequence verse markers', () => {
    // parse valid usfm file
    const usfmFile = outOfSequenceVerseMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1]).not.toBeUndefined();
    expect(Object.keys(usfm[1])).toHaveLength(30);
    expect(usfm[1][21]).toEqual(['For to me to live is Christ, and to die is gain.']);

    expect(usfm[2]).not.toBeUndefined();
    expect(Object.keys(usfm[2])).toHaveLength(30);
    expect(usfm[2][10]).toEqual(['So at the name of Jesus every knee should bow,']);

    expect(usfm[3]).not.toBeUndefined();
    expect(Object.keys(usfm[3])).toHaveLength(21);
    expect(usfm[3][11]).toEqual(['so somehow I may experience the resurrection from the dead.']);

    expect(usfm[4]).not.toBeUndefined();
    expect(Object.keys(usfm[4])).toHaveLength(23);
    expect(usfm[4][4]).toEqual(['Rejoice in the Lord always; again I will say, rejoice.']);
  });

  it('should handle missing chapter markers', () => {
    // parse valid usfm file
    const usfmFile = missingChapterMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1]).toBeUndefined();
    expect(usfm[2]).toBeUndefined();

    expect(usfm[3]).not.toBeUndefined();
    expect(Object.keys(usfm[3])).toHaveLength(21);
    expect(usfm[3][11]).toEqual(['so somehow I may experience the resurrection from the dead.']);
  });

  it('should handle missing a chapter marker', () => {
    // parse valid usfm file
    const usfmFile = missingAChapter;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[2]).toBeUndefined();
    expect(usfm[3]).not.toBeUndefined();

    expect(Object.keys(usfm[1])).toHaveLength(30);
    expect(Object.keys(usfm[3])).toHaveLength(21);
    expect(Object.keys(usfm[4])).toHaveLength(23);
    expect(usfm[3][1]).toEqual(['Finally, my brothers, rejoice in the Lord.  For me to write these same things to you is not a problem, and they will keep you safe.']);
  });

  it('should handle out of sequence chapter markers', () => {
    // parse valid usfm file
    const usfmFile = outOfSequenceChapterMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;

    expect(usfm[1]).not.toBeUndefined();
    expect(Object.keys(usfm[1])).toHaveLength(30);
    expect(usfm[1][21]).toEqual(['For to me to live is Christ, and to die is gain.']);

    expect(usfm[2]).not.toBeUndefined();
    expect(Object.keys(usfm[2])).toHaveLength(30);
    expect(usfm[2][10]).toEqual(['So at the name of Jesus every knee should bow,']);

    expect(usfm[3]).not.toBeUndefined();
    expect(Object.keys(usfm[3])).toHaveLength(21);
    expect(usfm[3][11]).toEqual(['so somehow I may experience the resurrection from the dead.']);

    expect(usfm[4]).not.toBeUndefined();
    expect(Object.keys(usfm[4])).toHaveLength(23);
    expect(usfm[4][4]).toEqual(['Rejoice in the Lord always; again I will say, rejoice.']);
  });
});

// deprecated. this should go in it's own file

// describe('jsonToUsfm', function() {
//   it('should take in a JSON object, and convert it to a string', () => {
//     let backToString = jsonToUsfm(converted);
//     assert.isString(backToString);
//     assert.isTrue(backToString.length >= 1700);
//   });
// });
