import * as USFM from '../src/js/USFM'

/**
 * Generator for testing usfm to json migration
 * @param {string} name - the name of the test files to use. e.g. `valid` will test `valid.usfm` to `valid.json`
 * @param {object} args - optional arguments to be passed to the converter
 */
const orderTest = (array = {}) => {
  const sorted = array.slice(0).sort();
  expect(sorted).toEqual(array);
};

it('NO_CONTENT_MARKERS should be in order', () => {
  orderTest(USFM.NO_CONTENT_MARKERS);
});

it('DISPLAYABLE_TEXT should be in order', () => {
  orderTest(USFM.DISPLAYABLE_TEXT);
});

it('NEED_TERMINATION_MARKERS should be in order', () => {
  orderTest(USFM.NEED_TERMINATION_MARKERS);
});
