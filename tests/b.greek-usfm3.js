const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const expect = require('chai').expect;
const fs = require('fs');

const usfmPath = './tests/static/tit.usfm';

describe('Greek USFM 3 - usfmToJson', function() {
  it('should return expected json data from usfm 3 string', function(done) {
    const usfm = fs.readFileSync(usfmPath, 'UTF-8').toString();
    const converted = usfmToJson(usfm);
    assert.isObject(converted);
    assert.isObject(converted.headers);
    assert.equal(converted.headers.h, 'Titus');
    assert.isObject(converted.chapters);
    assert.isObject(converted.chapters[1]);
    assert.isArray(converted.chapters[1][1]);
    assert.isObject(converted.chapters[1][1][0]);
    const word = {
      word: 'Παῦλος',
      lemma: 'Παῦλος',
      strongs: 'G39720',
      morph: 'Gr,N,,,,,NMS,'
    };
    expect(converted.chapters[1][1][0]).to.deep.equal(word);
    done();
  });
});
