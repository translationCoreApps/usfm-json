/* eslint-disable quote-props,no-use-before-define */
import isEqual from "deep-equal";
import {readJSON, readUSFM} from './util';
import {usfmToJSON, createUsfmObject, pushObject} from '../src/js/usfmToJson';

describe("Large - USFM to JSON", () => {
  it('handle large files quickly', () => {
    const input = readUSFM(`large.usfm`);
    expect(input).toBeTruthy();

    const iterations = 10;
    const start = process.hrtime();
    for (let i = 0; i < iterations; i++) {
      usfmToJSON(input);
    }
    const end = process.hrtime(start);
    const totalNano = end[0] * 10e9 + end[1];
    const avgNano = totalNano / iterations;
    const avgSeconds = avgNano / 10e9;
    // TRICKY: performance may vary depending on the platform.
    // Three seconds is a high bar to avoid tests failing on slow CI.
    expect(avgSeconds).toBeLessThanOrEqual(3);
  });
});

describe("USFM to JSON", () => {
  it('parses verse with an \\m marker inline with the text', () => {
    const input = "\\v 1 but the word of the Lord remains forever.\"\n\\m And this is the word of the gospel that was proclaimed to you.";
    const data = usfmToJSON(input, {chunk: true}).verses["1"].verseObjects;
    expect(data).toEqual([
      {
        "type": "text",
        "text": "but the word of the Lord remains forever.\"\n"
      },
      {
        "tag": "m",
        "type": "paragraph",
        "text": "And this is the word of the gospel that was proclaimed to you."
      }
    ]);
  });

  it('converts usfm with BOM to json', () => {
    generateTest('misc/RU-EST-UTF8_BOM');
  });

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

  it('handles greek characters in usfm - oldformat', () => {
    generateTest('greek.oldformat', {}, 'greek');
  });

  it('preserves punctuation in usfm', () => {
    generateTest('tit_1_12');
  });

  it('preserves punctuation in usfm - oldformat', () => {
    generateTest('tit_1_12.oldformat', {}, 'tit_1_12');
  });

  it('preserves punctuation in usfm when no words', () => {
    generateTest('tit_1_12.no.words');
  });

  it('preserves punctuation in usfm - word not on line start', () => {
    generateTest('tit_1_12.word.not.at.line.start', {}, 'tit_1_12');
  });

  it('word on new line after quote', () => {
    generateTest('tit_1_12_new_line');
  });

  it('preserves footnotes in usfm', () => {
    generateTest('tit_1_12_footnote');
  });

  it('preserves alignment in usfm', () => {
    generateTest('tit_1_12.alignment');
  });

  it('preserves alignment in usfm - oldformat', () => {
    generateTest('tit_1_12.alignment.oldformat', {oldFormat: true}, 'tit_1_12.alignment');
  });

  it('preserves alignment in usfm - zaln not at start', () => {
    generateTest('tit_1_12.alignment.zaln.not.start', {oldFormat: true}, 'tit_1_12.alignment');
  });

  it('process ISA footnote', () => {
    generateTest('isa_footnote');
  });

  it('process PSA quotes', () => {
    generateTest('psa_quotes');
  });

  it('process PSA Selah', () => {
    generateTest('psa_140_8.qs_selah');
  });

  it('process PSA Selah Space', () => {
    generateTest('psa_140_8.qs_space_selah');
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

  it('handles tw word attributes and spans - oldformat', () => {
    generateTest('tw_words.oldformat', {"content-source": "bhp", oldFormat: true}, 'tw_words');
  });

  it('handles tw word attributes and spans chunked', () => {
    generateTest('tw_words_chunk', {chunk: true});
  });

  it('handles greek word attributes and spans', () => {
    generateTest('greek_verse_objects', {"chunk": true, "content-source": "bhp"});
  });

  it('handles Tit 1:1 alignment', () => {
    generateTest('tit1-1_alignment',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}});
  });

  it('handles Tit 1:1 alignment - oldformat', () => {
    generateTest('tit1-1_alignment.oldformat',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}, oldFormat: true},
      'tit1-1_alignment');
  });

  it('handles Tit 1:1 alignment converts strongs to strong', () => {
    generateTest('tit1-1_alignment_strongs',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}});
  });

  it('handles Heb 1:1 alignment', () => {
    generateTest('heb1-1_multi_alignment',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}});
  });

  it('handles Heb 1:1 alignment - oldformat', () => {
    generateTest('heb1-1_multi_alignment.oldformat',
      {convertToInt: ["occurrence", "occurrences"], map: {ugnt: "content"}, oldFormat: true},
      'heb1-1_multi_alignment');
  });

  it('handles Gen 12:2 empty word', () => {
    generateTest('f10_gen12-2_empty_word', {"chunk": true, "content-source": "bhp"});
  });

  it('handles jmp tag', () => {
    generateTest('jmp', {chunk: true});
  });

  it('handles esb tag', () => {
    generateTest('esb', {chunk: true});
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
    generateTest('acts_1_4.aligned');
  });

  it('handles acts_1_4.aligned - oldformat', () => {
    generateTest('acts_1_4.aligned.oldformat', {oldFormat: true}, 'acts_1_4.aligned');
  });

  it('handles acts_1_milestone', () => {
    generateTest('acts_1_milestone');
  });

  it('handles acts_1_milestone.oldformat', () => {
    generateTest('acts_1_milestone.oldformat', {oldFormat: true}, 'acts_1_milestone');
  });

  it('handles acts-1-20.aligned', () => {
    generateTest('acts-1-20.aligned');
  });

  it('handles acts-1-20.aligned.oldformat', () => {
    generateTest('acts-1-20.aligned.oldformat', {oldFormat: true}, 'acts-1-20.aligned');
  });

  it('handles acts-1-20.aligned.crammed.oldformat', () => {
    generateTest('acts-1-20.aligned.crammed.oldformat', {oldFormat: true}, 'acts-1-20.aligned');
  });

  it('handles heb-12-27.grc', () => {
    generateTest('heb-12-27.grc', {chunk: true});
  });

  it('handles mat-4-6', () => {
    generateTest('mat-4-6', {zaln: true});
  });

  it('handles mat-4-6.oldformat', () => {
    generateTest('mat-4-6.oldformat', {zaln: true, oldFormat: true}, 'mat-4-6');
  });

  it('handles mat-4-6.whitespace', () => {
    generateTest('mat-4-6.whitespace', {zaln: true});
  });

  it('handles mat-4-6.whitespace.oldformat', () => {
    generateTest('mat-4-6.whitespace.oldformat', {zaln: true, oldFormat: true}, 'mat-4-6.whitespace');
  });

  it('handles phm.hi.alignment.oldformat', () => {
    generateTest('phm.hi.alignment.oldformat', {zaln: true, oldFormat: true}, 'phm.hi.alignment');
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
    generateTest('usfmIntroTest');
  });

  it('process inline_words', () => {
    generateTest('inline_words', {chunk: true});
  });

  it('process inline_God', () => {
    generateTest('inline_God', {chunk: true});
  });

  it('process tit_extra_space_after_chapter', () => {
    generateTest('tit_extra_space_after_chapter');
  });

  it('process misc_footnotes', () => {
    generateTest('misc_footnotes', {chunk: true});
  });

  it('process usfm-body-testF', () => {
    generateTest('usfm-body-testF');
  });

  it('process usfm-body-testF-paragraph-whitespace', () => {
    generateTest('usfm-body-testF-paragraph-whitespace',
  {convertToInt: ["occurrence", "occurrences"], words: true},
  'usfm-body-testF-paragraph-no-whitespace');
  });

  it('process hebrew_words', () => {
    generateTest('hebrew_words');
  });

  it('process hebrew_words.oldformat', () => {
    generateTest('hebrew_words.oldformat', {oldFormat: true}, 'hebrew_words');
  });

  it('process exported alignment acts_1_11', () => {
    generateTest('acts_1_11.aligned',
      {convertToInt: ["occurrence", "occurrences"], words: true});
  });

  it('process exported alignment acts_1_11 - oldformat', () => {
    generateTest('acts_1_11.aligned.oldformat',
      {convertToInt: ["occurrence", "occurrences"], words: true, oldFormat: true},
      'acts_1_11.aligned');
  });

  it('process hebrew punctuation exo_7:19', () => {
    generateTest('exo_7-19_punctuation_spacing',
      {convertToInt: ["occurrence", "occurrences"], words: true, chunk: true});
  });

  it('process exported 57-TIT.greek', () => {
    generateTest('57-TIT.greek',
      {convertToInt: ["occurrence", "occurrences"], words: true});
  });

  it('process exported 57-TIT.greek.oldformat', () => {
    generateTest('57-TIT.greek.oldformat',
      {convertToInt: ["occurrence", "occurrences"], words: true, oldFormat: true},
      '57-TIT.greek');
  });

  it('process exported 57-TIT-SR.greek', () => {
    generateTest('57-TIT-SR.greek',
      {convertToInt: ["occurrence", "occurrences"], words: true, oldFormat: true});
  });

  it('process exported 57-TIT.partial', () => {
    generateTest('57-TIT.partial',
      {convertToInt: ["occurrence", "occurrences"], words: true});
  });

  it('process exported 57-TIT.partial.oldformat', () => {
    generateTest('57-TIT.partial.oldformat',
      {convertToInt: ["occurrence", "occurrences"], words: true, oldFormat: true},
      '57-TIT.partial');
  });

  it('process greek with footnotes', () => {
    generateTest('acts_8-37-ugnt-footnote', {chunk: true});
  });

  it('preserves k markers and footnotes in 45-ACT.ugnt.oldformat', () => {
    generateTest('45-ACT.ugnt.oldformat', {oldFormat: true}, '45-ACT.ugnt');
  });

  // TODO: removed because we actually do not have the updated ugnt with new format of k spans yet
  // it('preserves k markers and footnotes in 45-ACT.ugnt', () => {
  //   generateTest('45-ACT.ugnt');
  // });
});

describe("createUsfmObject", () => {
  it('handles mis-parse of numbers in content', () => {
    const expected = {tag: "nuts", content: "5 kinds"};
    const marker = {open: "nuts 5", tag: "nuts", number: "5", text: "kinds"};
    const results = createUsfmObject(marker);
    expect(results).toEqual(expected);
  });
});

describe("pushObject", () => {
  it('handles pushing nested USFM String', () => {
    const expected = "1, 2";
    const state = {
      nested: [{content: "1"}]
    };
    const usfmObject = ", 2";
    pushObject(state, null, usfmObject);
    expect(state.nested[0].content).toEqual(expected);
  });

  it('handles pushing nested USFM Object', () => {
    const expected = "1 \\nuts 2";
    const state = {
      nested: [{content: "1 "}]
    };
    const usfmObject = {tag: "nuts", content: "2"};
    pushObject(state, null, usfmObject);
    expect(state.nested[0].content).toEqual(expected);
  });
});

//
// helpers
//

/**
 * Generator for testing usfm to json migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 * @param {object} args - optional arguments to be passed to the converter
 * @param {string} expectedName - optional different expected file
 */
const generateTest = (name, args = {}, expectedName = '') => {
  const input = readUSFM(`${name}.usfm`);
  const expectedBaseName = expectedName ? expectedName : name;
  const expected = readJSON(`${expectedBaseName}.json`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = usfmToJSON(input, args);
  if (args.oldFormat) {
    if (output.headers) {
      const pos = output.headers.findIndex((item) => (item.tag === "usfm"));
      if (pos < 0) { // put in usfm 3 flag for comparison if not present
        output.headers.splice(1, 0,
          {
            "tag": "usfm",
            "content": "3.0"
          }
        );
      }
    }
  }
  if (!isEqual(output, expected)) { // if different, break down comparisons by smaller chunks so output is not overloaded
    console.log("Miscompare in " + name);
    verifyWithPrompt(Object.keys(output).sort(), Object.keys(expected).sort(), "keys");
    verifyWithPrompt(output.headers, expected.headers, "headers");
    verifyWithPrompt(output.verses, expected.verses, "verses");
    const textField = "chapters";
    if (expected[textField]) {
      verifyWithPrompt(Object.keys(output[textField]), Object.keys(expected[textField]), "chapter numbers");
      if (!isEqual(output[textField], expected[textField])) {
        console.log("Chapter data is different");
        const chapters = Object.keys(output[textField]);
        chapters.forEach(chapter => {
          verifyWithPrompt(Object.keys(output[textField][chapter]).sort(), Object.keys(expected[textField][chapter]).sort(), "verses");
          const verses = Object.keys(output[textField][chapter]);
          verses.forEach(verse => {
            verifyWithPrompt(Object.keys(output[textField][chapter][verse]), Object.keys(expected[textField][chapter][verse]), "verse " + chapter + ":" + verse);
          });
          verifyWithPrompt(output[textField][chapter], expected[textField][chapter], "chapter " + chapter);
        });
      }
    } else {
      verifyWithPrompt(output.chapers, expected.chapers, "chapters");
    }
  }
};

/**
 * does comparison of expected and actual objects and gives console output of what is not matching
 * @param {Object} actual
 * @param {Object} expected
 * @param {String} name
 */
const verifyWithPrompt = (actual, expected, name) => {
  if (!isEqual(actual, expected)) {
    console.warn(name + " data does not match:");
  }
  expect(actual).toEqual(expected);
};
