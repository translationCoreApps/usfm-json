const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');

const usfmPath = './tests/static/chunk.txt';
let converted;
describe('Chunks - usfmToJson', function() {
  it('should return expected json data from usfm string', function() {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    converted = usfmToJson(usfm, {chapter: 1});
    assert.isObject(converted);
    assert.isObject(converted.headers);
    assert.isObject(converted.chapters);
    const chapter1 = converted.chapters[1];
    assert.isObject(chapter1);
    const verse13 = chapter1[13];
    assert.isArray(verse13);
    const verse14 = chapter1[14];
    assert.isArray(verse14);
    const verse15 = chapter1[15];
    assert.isArray(verse15);
    const text = verse13[0];
    assert.isString(text);
    const expected = 'I had many things to write to you, but I do not wish to write them to you with pen and ink.';
    expect(text).to.equal(expected);
  });
});

describe('Chunks - jsonToUsfm', function() {
  it('should take in a JSON object, and convert it to a string', function() {
    let backToString = jsonToUsfm(converted);
    assert.isString(backToString);
    assert.isTrue(backToString.length >= 250);
    assert.isTrue(backToString.length <= 255);
  });
});
