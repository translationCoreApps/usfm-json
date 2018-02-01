import {readJSON, readUSFM} from './util';
import {usfmToJSON} from '../src/js/usfmToJson';

/**
 * Generator for testing usfm to json migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 * @param {object} args - optional arguments to be passed to the converter
 * @param {string} expectedName - optional different expected file
 */
const generateTest = (name, args = {}, expectedName) => {
  const input = readUSFM(`${name}.usfm`);
  const expectedBaseName = expectedName ? expectedName : name;
  const expected = readJSON(`${expectedBaseName}.json`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = usfmToJSON(input, args);
  expect(output).toEqual(expected);
};

describe("USFM to JSON", () => {

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

  it('handles a chunk of usfm', () => {
    generateTest('chunk', {chunk: true});
  });

  it('handles a chunk with footnote', () => {
    generateTest('chunk_footnote', {chunk: true});
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

  it('process tstudio format with leading zeros', () => {
    generateTest('tstudio');
  });

  it('converts invalid usfm to json', () => {
    generateTest('invalid');
  });

  it('handles tw word attributes and spans', () => {
    generateTest('tw_words', {"content-source": "bhp"});
  });

  it('handles tw word attributes and spans chunked', () => {
    generateTest('tw_words_chunk', {chunk: true});
  });

  it('handles greek word attributes and spans', () => {
    generateTest('greek_verse_objects', {"chunk": true, "content-source": "bhp"});
  });

  it('handles Tit 1:1 alignment', () => {
    generateTest('tit1:1_alignment',
      {chunk: true, convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}},
      'tit1:1_alignment_no_lemma');
  });

  it('handles Tit 1:1 alignment converts strongs to strong', () => {
    generateTest('tit1:1_alignment_strongs',
      {chunk: true, convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}},
      'tit1:1_alignment_no_lemma');
  });
});
