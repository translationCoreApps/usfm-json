import fs from 'fs';
import path from 'path';
import {usfmToJSON} from '../src/js/usfmToJson';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

const RESOURCES = '__tests__/resources';

/**
 * Reads a usfm file from the resources dir
 * @param {string} filePath relative path to usfm file
 * @return {string} sdv
 */
export const readUSFM = filePath => {
  const fullPath = path.join(RESOURCES, filePath);
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
  const expected = readUSFM(name);
  expect(expected).toBeTruthy();
  console.log("Converting '" + name + "' to JSON");
  const json = usfmToJSON(expected);
  expect(json).toBeTruthy();
  console.log("Converting '" + name + "' back to USFM");
  const usfm = jsonToUSFM(json);
  fs.writeFileSync(path.join(RESOURCES, `${name}.converted`), usfm);
  expect(usfm).toEqual(expected);
};

const getFilesOfType = (folder, type) => {
  const results = [];
  const files = fs.readdirSync(folder);
  for (let file of files) {
    const parts = file.split('.');
    if ((parts.length == 2) && (parts[1].toLowerCase() === type)) {
      results.push(file);
    }
  }
  return results;
};

// describe('USFM -> JSON -> USFM en_ulb', () => {
//   const subFolder = 'en_ulb';
//   const files = getFilesOfType(path.join(RESOURCES, subFolder),'usfm');
//   for (let file of files) {
//     const folder = path.join(subFolder, file);
//
//     it(folder, () => {
//       generateRoundTripTest(folder);
//     });
//   }
// });
//
// it('util - handles missing verse markers 2', () => {
//   generateRoundTripTest('en_ulb/06-JOS.usfm');
// });

// it('util - handles missing verse markers 2', () => {
//   generateRoundTripTest('hi_ulb/57-TIT');
// });
//
