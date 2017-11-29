import fs from 'fs';
import path from 'path';
import {usfmToJSON} from '../src/js/usfmToJson';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

/**
 * Reads a usfm file from the resources dir
 * @param {string} filePath relative path to usfm file
 * @return {string} sdv
 */
export const readUSFM = filePath => {
  const fullPath = path.join('__tests__/resources', filePath);
  return fs.readFileSync(fullPath, 'UTF-8').toString();
};

/**
 * Reads a json file from the resources dir
 * @param {string} filePath relative path to json file
 * @return {object} json object
 */
export const readJSON = filePath => JSON.parse(readUSFM(filePath));

// TRICKY: ignore as test suite
it('provides test utilities');

const generateRoundTripTest = (name) => {
  const expected = readUSFM(`${name}.usfm`);
  expect(expected).toBeTruthy();
  const json = usfmToJSON(expected);
  expect(json).toBeTruthy();
  const usfm = jsonToUSFM(json);
  fs.writeFileSync(path.join('__tests__/resources', `${name}.converted.usfm`), usfm);
  expect(usfm).toEqual(expected);
};

// it('util - handles missing verse markers', () => {
//   generateRoundTripTest('en_ulb/20-PRO');
// });

// it('util - handles missing verse markers 2', () => {
//   generateRoundTripTest('hi_ulb/57-TIT');
// });
//
