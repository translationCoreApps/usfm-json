/* eslint-env jest */

const jsonToUsfm = require('../src/js/jsonToUsfm.js').jsonToUSFM;

// TODO: place json to usfm test in here
let converted;
describe('jsonToUsfm', function() {
    it('should take in a JSON object, and convert it to a string', () => {
        let backToString = jsonToUsfm(converted);
        assert.isString(backToString);
        assert.isTrue(backToString.length >= 1700);
    });
});
