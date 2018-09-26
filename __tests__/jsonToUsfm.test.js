import {readJSON, readUSFM} from './util';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

/**
 * Generator for testing json to usfm migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 * @param {object} params - optional parameters to pass to converter
 * @param {string} expectedName - optional different expected file
 */
const generateTest = (name, params, expectedName) => {
  const input = readJSON(`${name}.json`);
  const expectedBaseName = expectedName ? expectedName : name;
  const expected = readUSFM(`${expectedBaseName}.usfm`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = jsonToUSFM(input, params);
  expect(output).toEqual(expected);
};

describe("JSON to USFM", () => {

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

  it('process 1CH verse span', () => {
    generateTest('1ch_verse_span');
  });

  it('process ISA inline quotes', () => {
    generateTest('isa_inline_quotes');
  });

  it('process PRO footnote', () => {
    generateTest('pro_footnote');
  });

  it('process PRO quotes', () => {
    generateTest('pro_quotes');
  });

  it('process JOB footnote', () => {
    generateTest('job_footnote');
  });

  it('process LUK quotes', () => {
    generateTest('luk_quotes');
  });

  it('process tw word attributes and spans', () => {
    generateTest('tw_words', {ignore: ["content-source"], mileStoneIgnore: ["content-source"]});
  });

  it('process tw word attributes and spans chunked', () => {
    generateTest('tw_words_chunk', {chunk: true, ignore: ["content-source"], mileStoneIgnore: ["content-source"]});
  });

  it('handles Tit 1:1 alignment', () => {
    generateTest('tit1-1_alignment', {chunk: true, mileStoneIgnore: ["lemma", "morph"], mileStoneMap: {content: "ugnt"}});
  });

  it('handles Tit 1:1 alignment converts strongs to strong', () => {
    generateTest('tit1-1_alignment_strongs',
      {chunk: true, mileStoneIgnore: ["lemma", "morph"], mileStoneMap: {content: "ugnt"}},
      'tit1-1_alignment');
  });

  it('handles Heb 1:1 alignment', () => {
    generateTest('heb1-1_multi_alignment',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}});
  });

  it('handles Tit 1:1 no newlines', () => {
    generateTest('titus_no_newlines');
  });

  it('handles jmp tag', () => {
    generateTest('jmp', {chunk: true});
  });
});
