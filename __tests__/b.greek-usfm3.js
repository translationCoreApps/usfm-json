/* eslint-env jest */

const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');

const usfmPath = './tests/static/tit.usfm';
var converted;
describe('Greek USFM 3 - usfmToJson', function() {
  it('should return expected json data from usfm 3 string', function() {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    converted = usfmToJson(usfm);
    assert.isObject(converted);
    assert.isObject(converted.headers);
    assert.equal(converted.headers.h, 'Titus');
    assert.isObject(converted.chapters);
    const chapter1 = converted.chapters[1];
    assert.isObject(chapter1);
    const verse1 = chapter1[1];
    assert.isArray(verse1);
    const word1 = verse1[0];
    assert.isObject(word1);
    const word = {
      word: 'Παῦλος',
      lemma: 'Παῦλος',
      strongs: 'G39720',
      morph: 'Gr,N,,,,,NMS,'
    };
    expect(word1).to.deep.equal(word);
  });
});

describe('Greek USFM 3 - jsonToUsfm', function() {
  it('should take in a JSON object, and convert it to a string', function() {
    let backToString = jsonToUsfm(converted);
    assert.isString(backToString);
    assert.isTrue(backToString.length >= 44800);
    assert.isTrue(backToString.length <= 45000);
  });
});
