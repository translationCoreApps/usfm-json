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

it('removes f tags', () => {
  const expected = '...Christ\\q Jesus. ';
  const output = removeMarker(input, 'f');
  expect(output).toEqual(expected);
});

it('removes q tags', () => {
  const expected = '...Christ Jesus. \\f + \\ft Some early versions omit, \\fqa in Ephesus, \\fqa* but this expression is probably in Paul\'s original letter.\\f*';
  const output = removeMarker(input, 'q');
  expect(output).toEqual(expected);
});

it('cleans multiple usfm tags from 1jn1:4', () => {
  generateTest('filter/1jn1:4', ['f', 'q', 's5', 'p', 'z']);
});

