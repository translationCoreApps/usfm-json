const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');

const usfmPath = './tests/static/chunk.txt';
var converted;
describe('Chunks - usfmToJson', function() {
  it('should return expected json data from usfm string', function() {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    converted = usfmToJson(usfm, {chunk: true});
    assert.isObject(converted);
    assert.isObject(converted.verses);
    const verses = converted.verses;
    assert.isObject(verses);
    const verse13 = verses[13];
    assert.isArray(verse13);
    const verse14 = verses[14];
    assert.isArray(verse14);
    const verse15 = verses[15];
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
    expect(backToString).to.include('\\v 14 But I expect to see you soon, and we will speak face to face');
    expect(backToString).to.include('\\v 15 May peace be with you. The friends greet you. Greet the friends by name.');
  });
});
