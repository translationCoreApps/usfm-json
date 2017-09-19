const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');

let converted;
describe('usfmToJson', function() {
  it('should return expected json data from usfm string', function() {
    const usfmPath = './tests/static/3john.usfm';
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
});

describe('jsonToUsfm', function() {
  it('should take in a JSON object, and convert it to a string', function() {
    let backToString = jsonToUsfm(converted);
    assert.isString(backToString);
    assert.isTrue(backToString.length >= 1700);
  });
});
