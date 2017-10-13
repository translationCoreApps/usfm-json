import {readJSON, readUSFM} from './util';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

it('converts json to usfm', () => {
  const input = readJSON('valid.json');
  const expected = readUSFM('valid.usfm');
  expect(input).toBeTruthy();
  expect(expected).toBeTruthy();
  const output = jsonToUSFM(input);
  expect(output).toEqual(expected);
});
