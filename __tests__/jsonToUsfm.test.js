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

it('handles missing verse markers', () => {
  generateTest('missing_verses');
});

it('handles greek characters in usfm', () => {
  generateTest('greek');
});

it('preserves punctuation in usfm', () => {
  generateTest('tit_1_12');
});

it('preserves white space in usfm new_line', () => {
  generateTest('tit_1_12_new_line');
});

it('preserves footnotes in usfm', () => {
  generateTest('tit_1_12_footnote');
});

it('process ISA footnote', () => {
  generateTest('isa_footnote');
});

it('process PSA quotes', () => {
  generateTest('psa_quotes');
});

it('process ISA verse span', () => {
  generateTest('isa_verse_span');
});

it('process ISA inline quotes', () => {
  generateTest('isa_inline_quotes');
});

it('process PRO footnote', () => {
  generateTest('pro_footnote');
});


