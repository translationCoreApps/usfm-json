import {readJSON, readUSFM} from './util';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

/**
 * Generator for testing json to usfm migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 */
const generateTest = name => {
  const input = readJSON(`${name}.json`);
  const expected = readUSFM(`${name}.usfm`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = jsonToUSFM(input);
  expect(output).toEqual(expected);
};

it('converts json to usfm', () => {
  generateTest('valid');
});

it('converts greek json to usfm', () => {
  generateTest('greek');
});
