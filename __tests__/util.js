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
it('provides test utilities', ()=>{});

const generateRoundTripTest = (name) => {
  const expected = readUSFM(name);
  expect(expected).toBeTruthy();
  console.log("Converting '" + name + "' to JSON");
  const json = usfmToJSON(expected);
  expect(json).toBeTruthy();
  console.log("Converting '" + name + "' back to USFM");
  let usfm = jsonToUSFM(json);
  fs.writeFileSync(path.join(RESOURCES, `${name}.converted`), usfm);
  if (usfm !== expected) {
    // see if extra LF at end
    const usfmTrim = usfm.substr(0, usfm.length - 1);
    const lastChar = usfm.substr(usfm.length - 1);
    if ((lastChar === '\n') && (usfmTrim === expected)) {
      usfm = usfmTrim;
    }
  }
  expect(usfm).toEqual(expected);
};

const getFilesOfType = (folder, type) => {
  const results = [];
  const files = fs.readdirSync(folder);
  for (let file of files) {
    const parts = file.split('.');
    if ((parts.length === 2) && (parts[1].toLowerCase() === type)) {
      results.push(file);
    }
  }
  return results;
};

/**
 * @description - downloads usfm file
 * @param {string} url url to download
 * @param {function} callback - executed after load finishes
 */
function getText(url, callback) {
  let request = require('request');
  request.get({
    url: url,
    json: false
  }, (err, res, data) => {
    if (err) {
      callback(null);
    } else {
      callback(data);
    }
  });
}

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
// // current failures due to source errors:
// //    en_ulb/06-JOS.usfm
//
//
// it('get bibles list', () => {
//   getText('https://api.door43.org/v3/catalog.json', (data) => {
//     const bibles = {};
//     const catalog = JSON.parse(data);
//     const languages = catalog.languages;
//     for (let language of languages) {
//       for (let resource of language.resources) {
//         if (resource.subject === "Bible") {
//           for (let format of resource.formats) {
//             if (format.format.indexOf("application/zip") >= 0) {
//               bibles[language.identifier] = {
//                 format: format.format,
//                 url: format.url
//               };
//             }
//           }
//         }
//       }
//     }
//     const biblesJson = JSON.stringify(bibles, null, 2);
//     fs.writeFileSync(path.join(RESOURCES, 'bibles.json'), biblesJson);
//   });
// });
//
// it('util - handles missing verse markers 2', () => {
//   generateRoundTripTest('hi_ulb/05-DEU.usfm');
// });

