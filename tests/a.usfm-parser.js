const usfmToJson = require('../src/js/usfmToJson.js').usfmToJSON;
const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;
const describe = require('mocha').describe;
const it = require('mocha').it;
const assert = require('chai').assert;
const fs = require('fs');

// var converted;
// describe('usfmToJson', function() {
//   it('should return expected json data from usfm string', function(done) {
//     this.timeout(50000);
//     fs.readFile('./tests/static/3john.usfm', function(err, data) {
//       assert.isNull(err);
//       converted = usfmToJson(data.toString());
//       assert.isObject(converted);
//       assert.isObject(converted.headers);
//       assert.equal(converted.headers.h, '3 John');
//       assert.isArray(converted.chapters);
//       done();
//     });
//   });
// });
//
// describe('jsonToUsfm', function() {
//   it('should take in a JSON object, and convert it to a string', function() {
//     var backToString = jsonToUsfm(converted);
//     assert.isString(backToString);
//     assert.isTrue(backToString.length > 1700);
//   });
// });
