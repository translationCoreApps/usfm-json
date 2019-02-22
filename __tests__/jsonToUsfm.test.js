/* eslint-disable no-use-before-define,padded-blocks */
import {readJSON, readUSFM} from './util';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

describe("JSON to USFM", () => {

  it('converts json to usfm', () => {
    generateTest('valid');
  });

  it('handles missing verse markers', () => {
    generateTest('missing_verses');
  });

  it('handles greek characters in usfm', () => {
    generateTest('greek', {words: true});
  });

  it('preserves punctuation in usfm', () => {
    generateTest('tit_1_12', {words: true});
  });

  it('preserves punctuation in usfm when no words', () => {
    generateTest('tit_1_12.no.words');
  });

  it('preserves footnotes in usfm', () => {
    generateTest('tit_1_12_footnote');
  });

  it('preserves alignment in usfm', () => {
    generateTest('tit_1_12.alignment', {zaln: true});
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
    generateTest('tw_words', {ignore: ["content-source"], mileStoneIgnore: ["content-source"], words: true});
  });

  it('process tw word attributes and spans chunked', () => {
    generateTest('tw_words_chunk', {chunk: true, ignore: ["content-source"], mileStoneIgnore: ["content-source"], words: true});
  });

  it('handles Tit 1:1 alignment', () => {
    generateTest('tit1-1_alignment', {chunk: true, mileStoneIgnore: ["lemma", "morph"], mileStoneMap: {content: "ugnt"}, zaln: true});
  });

  it('handles Tit 1:1 alignment converts strongs to strong', () => {
    generateTest('tit1-1_alignment_strongs',
      {mileStoneIgnore: ["lemma", "morph"], mileStoneMap: {content: "ugnt"}, zaln: true},
      'tit1-1_alignment');
  });

  it('handles Heb 1:1 alignment', () => {
    generateTest('heb1-1_multi_alignment',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}, zaln: true});
  });

  it('handles Tit 1:1 no newlines', () => {
    generateTest('titus_no_newlines', {forcedNewLines: true});
  });

  it('handles jmp tag', () => {
    generateTest('jmp', {chunk: true});
  });

  it('handles qt tag', () => {
    generateTest('qt', {chunk: true});
  });

  it('handles nb tag', () => {
    generateTest('nb', {chunk: true});
  });

  it('handles ts tag', () => {
    generateTest('ts', {chunk: true});
  });

  it('handles ts_2 tag', () => {
    generateTest('ts_2', {chunk: true});
  });

  it('handles acts_1_11', () => {
    generateTest('acts_1_11', {chunk: true});
  });

  it('handles acts_1_4', () => {
    generateTest('acts_1_4', {chunk: true});
  });

  it('handles acts_1_4.aligned', () => {
    generateTest('acts_1_4.aligned', {zaln: true});
  });

  it('handles acts_1_milestone', () => {
    generateTest('acts_1_milestone', {zaln: true});
  });

  it('handles acts-1-20.aligned', () => {
    generateTest('acts-1-20.aligned', {zaln: true}, 'acts-1-20.aligned');
  });

  it('handles mat-4-6', () => {
    generateTest('mat-4-6', {zaln: true});
  });

  it('handles mat-4-6.whitespace', () => {
    generateTest('mat-4-6.whitespace', {zaln: true});
  });

  it('handles gn_headers', () => {
    generateTest('gn_headers');
  });

  it('handles usfmBodyTestD', () => {
    generateTest('usfmBodyTestD');
  });

  it('handles links', () => {
    generateTest('links');
  });

  it('handles usfmIntroTest', () => {
    generateTest('usfmIntroTest', {}, 'usfmIntroTestCleaned');
  });

  it('process inline_words but not on newline', () => {
    generateTest('inline_words', {forcedNewLines: false, chunk: true});
  });

  it('process inline_God', () => {
    generateTest('inline_God', {chunk: true});
  });

  it('process tit_extra_space_after_chapter', () => {
    generateTest('tit_extra_space_after_chapter');
  });

  it('process usfm-body-testF', () => {
    generateTest('usfm-body-testF');
  });

  it('process usfm-body-testF inline', () => {
    generateTest('usfm-body-testF', {forcedNewLines: false}, 'usfm-body-testF-inline');
  });

  it('process hebrew_words', () => {
    generateTest('hebrew_words', {words: true});
  });

  it('process alignment acts_1_11', () => {
    generateTest('acts_1_11.aligned', {words: true});
  });

  it('process 57-TIT.greek', () => {
    generateTest('57-TIT.greek', {words: true});
  });

  it('process alignment 57-TIT.partial', () => {
    generateTest('57-TIT.partial', {words: true});
  });
});

//
// helpers
//

function normalizeAtributesAlign(tag, source) {
  let parts = source.split(tag);
  const length = parts.length;
  for (let i = 1; i < length; i++) {
    const part = parts[i];
    let endMarker = "\n";
    const posEndMarker = part.indexOf("\\*");
    if (posEndMarker >= 0) {
      const posNewLine = part.indexOf('\n');
      if ((posNewLine < 0) || (posNewLine > posEndMarker)) {
        endMarker = "\\*"; // old format ended at new line
      }
    }
    let lines = part.split(endMarker);
    let attributes = lines[0].split(' ');
    attributes = attributes.sort();
    const newAttributes = attributes.join(' ');
    lines[0] = newAttributes;
    parts[i] = lines.join(endMarker);
  }
  const normalized = parts.join(tag);
  return normalized;
}

function normalizeAtributesWord(tag, source) {
  let parts = source.split(tag);
  const length = parts.length;
  for (let i = 1; i < length; i++) {
    const item = parts[i];
    if (item.substr(0, 1) !== '*') {
      let sections = item.split('|');
      if (sections <= 1) {
        console.log("Broken word tag: " + item);
      } else {
        const text = sections[0];
        let attributes = sections[1].split(' ');
        attributes = attributes.sort();
        while (attributes.length && (attributes[0] === '')) {
          attributes.splice(0, 1);
        }
        attributes = attributes.join(' ');
        parts[i] = text + '|' + attributes;
      }
    }
  }
  const normalized = parts.join(tag);
  return normalized;
}

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
  if (!params || params.forcedNewLines !== false) {
    params = params || {};
    params.forcedNewLines = true; // we default to true for testing
  }
  const output = jsonToUSFM(input, params);
  if (params && params.zaln) { // normalize attributes
    const tag = "\\zaln-s | ";
    let outputNormal = normalizeAtributesAlign(tag, output);
    let expectedNormal = normalizeAtributesAlign(tag, expected);
    const wordTag = '\\w';
    outputNormal = normalizeAtributesWord(wordTag, outputNormal);
    expectedNormal = normalizeAtributesWord(wordTag, expectedNormal);
    expect(outputNormal).toEqual(expectedNormal);

  } else if (params && params.words) { // normalize attributes
    const tag = '\\w';
    const outputNormal = normalizeAtributesWord(tag, output);
    const expectedNormal = normalizeAtributesWord(tag, expected);
    expect(outputNormal).toEqual(expectedNormal);
  } else {
    expect(output).toEqual(expected);
  }
};

