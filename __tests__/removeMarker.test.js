import {readUSFM} from './util';
import {removeMarker} from '../src/js/filter';

const input = '...Christ\\q Jesus. \\f + \\ft Some early versions omit, \\fqa in Ephesus, \\fqa* but this expression is probably in Paul\'s original letter.\\f*';

/**
 * Generator for testing usfm filtering
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 * @param {object} type - optional type to pass to converter
 */
const generateTest = (name, type) => {
  const input = readUSFM(`${name}.raw.usfm`);
  const expected = readUSFM(`${name}.out.usfm`);
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = removeMarker(input, type);
  expect(output).toEqual(expected);
};

it('removes all extra tags', () => {
  const expected = '...Christ Jesus. ';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f and q tags', () => {
  const expected = '...Christ Jesus. ';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f tags and following s5 tag', () => {
  const input = "He even tried to desecrate the temple, so we arrested him.\\f + \\ft Some ancient copies add, \\fqa \"We wanted to judge him according to our law \\fqa* . \\f*\\s5";
  const expected = 'He even tried to desecrate the temple, so we arrested him.';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f and s5 tags', () => {
  const input = "He even tried to desecrate the temple, so we arrested him.\\f + \\ft Some ancient copies add, \\fqa \"We wanted to judge him according to our law \\fqa* . \\f*\\s5";
  const expected = 'He even tried to desecrate the temple, so we arrested him.';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f tags and following p tag', () => {
  const input = "\\f + \\ft Acts 28:29—Some ancient copies have verse 29: \\fqa When he had said these things, the Jews went away. They were having a great dispute among themselves \\fqa* . \\f*\\p";
  const expected = '';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f and p tags', () => {
  const input = "\\f + \\ft Acts 28:29—Some ancient copies have verse 29: \\fqa When he had said these things, the Jews went away. They were having a great dispute among themselves \\fqa* . \\f*\\p";
  const expected = '';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes q tags', () => {
  const expected = '...Christ Jesus. ';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes q, m, and s5 tags', () => {
  const input = "and,\n\\q \"A stone of stumbling\n\\q and a rock that makes them fall.\"\n\\m They stumble because they disobey the word—which is also what they were appointed to do.\n\n\\s5";
  const expected = "and,\n\"A stone of stumbling\nand a rock that makes them fall.\"\nThey stumble because they disobey the word—which is also what they were appointed to do.\n\n";
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('cleans multiple usfm tags from 1jn1:4', () => {
  generateTest('filter/1jn1:4');
});

