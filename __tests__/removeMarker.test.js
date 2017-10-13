import {removeMarker} from '../src/js/filter';

const input = '...Christ \\q Jesus. \\f + \\ft Some early versions omit, \\fqa in Ephesus, \\fqa* but this expression is probably in Paul\'s original letter.\\f*';

it('removes all extra tags', () => {
  const expected = '...Christ Jesus. Some early versions omit, in Ephesus, but this expression is probably in Paul\'s original letter.';
  const output = removeMarker(input);
  expect(output).toEqual(expected);
});

it('removes f tags', () => {
  const expected = '...Christ \\q Jesus. Some early versions omit, in Ephesus, but this expression is probably in Paul\'s original letter.';
  const output = removeMarker(input, 'f');
  expect(output).toEqual(expected);
});

it('removes q tags', () => {
  const expected = '...Christ Jesus. \\f + \\ft Some early versions omit, \\fqa in Ephesus, \\fqa* but this expression is probably in Paul\'s original letter.\\f*';
  const output = removeMarker(input, 'q');
  expect(output).toEqual(expected);
});
