import {readJSON, readUSFM} from './util';
import {usfmToJSON} from '../src/js/usfmToJson';

/**
 * Generator for testing usfm to json migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 */
const generateTest = name => {
  const input = readUSFM(`${name}.usfm`);
  const expected = readJSON(`${name}.json`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = usfmToJSON(input);
  expect(output).toEqual(expected);
};

it('converts usfm to json', () => {
  generateTest('valid');
});

it('handles missing verse markers', () => {
  generateTest('missing_verses');
});

it('handles out of sequence verse markers', () => {
  generateTest('out_of_sequence_verses');
});

it('handles missing chapter markers', () => {
  generateTest('missing_chapters');
});

it('handles out of sequence chapter markers', () => {
  generateTest('out_of_sequence_chapters');
});
