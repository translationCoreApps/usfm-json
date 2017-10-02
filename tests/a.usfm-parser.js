const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');
const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;

const missingVerseMarkers = './tests/static/missing/many_missing_verses.usfm';
const missingChapterMarkers = './tests/static/missing/many_missing_chapters.usfm';
const missingAChapter = './tests/static/missing/php_usfm_NoC2.usfm';
const outOfSequenceVerseMarkers = './tests/static/out_of_sequence/verse_markers.usfm';
const outOfSequenceChapterMarkers = './tests/static/out_of_sequence/chapter_markers.usfm';

const usfmPath = './tests/static/3john.usfm';
var converted;
describe('usfmToJson', function() {
  it('should return expected json data from usfm string', function() {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    converted = usfmToJson(usfm);
    assert.isObject(converted);
    assert.isObject(converted.headers);
    assert.equal(converted.headers.h, '3 John');
    assert.isObject(converted.chapters);
    const chapter1 = converted.chapters[1];
    assert.isObject(chapter1);
    const verse1 = chapter1[1];
    assert.isArray(verse1);
    const text = verse1[0];
    assert.isString(text);
    const expected = 'The elder to beloved Gaius, whom I love in truth.';
    expect(text).to.equal(expected);
  });
  it('should handle missing verse markers', () => {
    // parse valid usfm file
    const usfmFile = missingVerseMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1][3]).to.be.undefined;
    expect(usfm[1][4]).to.be.undefined;
    expect(usfm[1][21]).to.deep.equal(['For to me to live is Christ, and to die is gain.']);
    expect(30 - Object.keys(usfm[1]).length).to.deep.equal(2);

    expect(usfm[2][5]).to.be.undefined;
    expect(usfm[2][6]).to.be.undefined;
    expect(usfm[2][10]).to.deep.equal(['So at the name of Jesus every knee should bow,']);
    expect(30 - Object.keys(usfm[2]).length).to.deep.equal(2);

    expect(usfm[3][5]).to.be.undefined;
    expect(usfm[3][10]).to.be.undefined;
    expect(usfm[3][11]).to.be.undefined;
    expect(usfm[3][15]).to.be.undefined;
    expect(usfm[3][16]).to.be.undefined;
    expect(usfm[3][17]).to.deep.equal(['Brothers, join me and imitate me, and watch closely those who are walking by our example.']);
    expect(21 - Object.keys(usfm[3]).length).to.deep.equal(5);

    expect(usfm[4][1]).to.be.undefined;
    expect(usfm[4][21]).to.be.undefined;
    expect(usfm[4][22]).to.be.undefined;
    expect(usfm[4][4]).to.deep.equal(['Rejoice in the Lord always; again I will say, rejoice.']);
    expect(23 - Object.keys(usfm[4]).length).to.deep.equal(3);
  });

  it('should handle out of sequence verse markers', () => {
    // parse valid usfm file
    const usfmFile = outOfSequenceVerseMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1]).not.to.be.undefined;
    expect(Object.keys(usfm[1])).to.have.lengthOf(30);
    expect(usfm[1][21]).to.deep.equal(['For to me to live is Christ, and to die is gain.']);

    expect(usfm[2]).not.to.be.undefined;
    expect(Object.keys(usfm[2])).to.have.lengthOf(30);
    expect(usfm[2][10]).to.deep.equal(['So at the name of Jesus every knee should bow,']);

    expect(usfm[3]).not.to.be.undefined;
    expect(Object.keys(usfm[3])).to.have.lengthOf(21);
    expect(usfm[3][11]).to.deep.equal(['so somehow I may experience the resurrection from the dead.']);

    expect(usfm[4]).not.to.be.undefined;
    expect(Object.keys(usfm[4])).to.have.lengthOf(23);
    expect(usfm[4][4]).to.deep.equal(['Rejoice in the Lord always; again I will say, rejoice.']);
  });

  it('should handle missing chapter markers', () => {
    // parse valid usfm file
    const usfmFile = missingChapterMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[1]).to.be.undefined;
    expect(usfm[2]).to.be.undefined;

    expect(usfm[3]).not.to.be.undefined;
    expect(Object.keys(usfm[3])).to.have.lengthOf(21);
    expect(usfm[3][11]).to.deep.equal(['so somehow I may experience the resurrection from the dead.']);
  });

  it('should handle missing a chapter marker', () => {
    // parse valid usfm file
    const usfmFile = missingAChapter;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;
    expect(usfm[2]).to.be.undefined;
    expect(usfm[3]).not.to.be.undefined;

    expect(Object.keys(usfm[1])).to.have.lengthOf(30);
    expect(Object.keys(usfm[3])).to.have.lengthOf(21);
    expect(Object.keys(usfm[4])).to.have.lengthOf(23);
    expect(usfm[3][1]).to.deep.equal(['Finally, my brothers, rejoice in the Lord.  For me to write these same things to you is not a problem, and they will keep you safe.']);
  });

  it('should handle out of sequence chapter markers', () => {
    // parse valid usfm file
    const usfmFile = outOfSequenceChapterMarkers;
    const usfmRaw = fs.readFileSync(usfmFile, 'UTF-8').toString();
    const usfm = usfmToJson(usfmRaw).chapters;

    expect(usfm[1]).not.to.be.undefined;
    expect(Object.keys(usfm[1])).to.have.lengthOf(30);
    expect(usfm[1][21]).to.deep.equal(['For to me to live is Christ, and to die is gain.']);

    expect(usfm[2]).not.to.be.undefined;
    expect(Object.keys(usfm[2])).to.have.lengthOf(30);
    expect(usfm[2][10]).to.deep.equal(['So at the name of Jesus every knee should bow,']);

    expect(usfm[3]).not.to.be.undefined;
    expect(Object.keys(usfm[3])).to.have.lengthOf(21);
    expect(usfm[3][11]).to.deep.equal(['so somehow I may experience the resurrection from the dead.']);

    expect(usfm[4]).not.to.be.undefined;
    expect(Object.keys(usfm[4])).to.have.lengthOf(23);
    expect(usfm[4][4]).to.deep.equal(['Rejoice in the Lord always; again I will say, rejoice.']);
  });
});

describe('jsonToUsfm', function() {
  it('should take in a JSON object, and convert it to a string', function() {
    let backToString = jsonToUsfm(converted);
    assert.isString(backToString);
    assert.isTrue(backToString.length >= 1700);
  });
});
