/* eslint-disable no-use-before-define */
import fs from 'fs';
import path from 'path';
import {readUSFM} from './util';
import {usfmToJSON} from '../src/js/usfmToJson';
import {jsonToUSFM} from '../src/js/jsonToUsfm';

describe("USFM to JSON to USFM", () => {
  const folder = path.join('__tests__', 'resources', 'roundTrip');
  let files = fs.readdirSync(folder);
  files = files.filter(file => {
    const parsed = path.parse(file);
    return (parsed.ext.toLowerCase() === '.usfm');
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // if (i < 0) {
    //   continue;
    // }

    it(file + ": verify round trip from usfm to json and back doesn't lose data", () => {
      roundTripTest(file);
    });

    // if (i >= 12) {
    //   break;
    // }
  }
});

//
// helpers
//

function keyRightTrim(received) {
  if ((received.indexOf("\\k-s") < 0) && (received.indexOf("\\zaln-s") < 0) && (received.indexOf("\\w") < 0)) {
    return received;
  }
  const trimmed = received.replace(/\s+$/, "");
  return trimmed;
}

function wordEndTrim(received) {
  const trimmed = received.replace(/\s+\\w\*/, "\\w*");
  return trimmed;
}

function linesDifferent(received, expected) {
  if (received === expected) {
    return false;
  }
  const receivedTrim = keyRightTrim(received);
  const expectedTrim = keyRightTrim(expected);
  if (receivedTrim === expectedTrim) {
    return false;
  }
  if (wordEndTrim(received) === wordEndTrim(expected)) {
    return false;
  }
  return true;
}

function validateUSFM(usfm, input) {
  const failed = usfm !== input;
  let miscompares = 0;
  if (failed) {
    const source = input.split('\n');
    const results = usfm.split('\n');
    const lines = source.length < results.length ?
      source.length : results.length;
    for (let i = 0; i < lines; i++) {
      const expected = source[i];
      const received = results[i];
      const miscompare = linesDifferent(received, expected);
      if (miscompare) {
        console.log((i + 1) + " expected:\n  " + expected + "\nBut received: \n  " + received);
        // expect(received).toEqual(expected);
        miscompares++;
      }
    }
    if (miscompares) {
      console.log("Found miscompares in " + miscompares + " lines");
    }
  }
  return miscompares;
}

function verifyAttribute(object, key, chapter, verse) {
  let error = false;
  const value = object[key];
  if (!value || !value.trim()) {
    error = true;
    console.log("Missing attribute '" + key + "' in chapter " + chapter + ":" + verse + ": " + JSON.stringify(object));
  }
  return error;
}

function verifyNoAttribute(object, key, chapter, verse) {
  let error = false;
  const value = object[key];
  if (value) {
    error = true;
    console.log("Extra attribute '" + key + "' in chapter " + chapter + ":" + verse + ": " + JSON.stringify(object));
  }
  return error;
}

function verifyStrongsAttribute(object, chapter, verse) {
  const key = "strong";
  let error = verifyAttribute(object, key, chapter, verse);
  if (!error) {
    const value = object[key];
    error = error || (/^G\d{5}$/.test(value[0]));
    error = error || (parseInt(value.substr(1), 10) <= 0);
    if (error) {
      console.log("Invalid attribute '" + key + "' in chapter " + chapter + ":" + verse + ": " + JSON.stringify(object));
    }
  }
  return error;
}

function verifyTwAttribute(object, chapter, verse, optional) {
  const key = "tw";
  let error = false;
  if (!optional) {
    error = verifyAttribute(object, key, chapter, verse);
  }
  if (!error) {
    const value = object[key];
    if (value) {
      const dictAddressParts = value.split('rc://*/tw/dict/bible/'); // should be format: rc://*/tw/dict/bible/kt/jesus
      error = error || (dictAddressParts.length !== 2);
      error = error || (dictAddressParts[0].length !== 0);
      error = error || (dictAddressParts[1].length < 3);
      if (!error) {
        const subAddressParts = dictAddressParts[1].split('/');
        error = error || (subAddressParts.length !== 2);
        error = error || (['names', 'kt', 'other'].indexOf(subAddressParts[0]) < 0);
        error = error || (subAddressParts[1].length < 2);
      }
    }
    if (error) {
      console.log("Invalid attribute '" + key + "' in chapter " + chapter + ":" + verse + ": " + JSON.stringify(object));
    }
  }
  return error;
}

function verifychildren(object, chapter, verse) {
  const key = "children";
  const value = object[key];
  let error = (!value) || !(value.length > 0);
  if (!error) {
    error = validateVerseObjects(value, chapter, verse, 0) > 0;
  }
  if (error) {
    console.log("Invalid milestone attribute '" + key + "' in chapter " + chapter + ":" + verse + ": " + JSON.stringify(object));
  }
  return error;
}

function validateVerseObjects(verseObjects, chapter, verse, errors) {
  for (let object of verseObjects) {
    let error = false;
    if (object.type === 'word') {
      error = error || verifyAttribute(object, 'text', chapter, verse);
      error = error || verifyAttribute(object, 'lemma', chapter, verse);
      error = error || verifyAttribute(object, 'morph', chapter, verse);
      error = error || verifyStrongsAttribute(object, chapter, verse);
      error = error || verifyTwAttribute(object, chapter, verse, true);
      error = error || verifyNoAttribute(object, 'children', chapter, verse);
    } else if (object.type === 'milestone') {
      error = error || verifyAttribute(object, 'tag', chapter, verse);
      error = error || verifyNoAttribute(object, 'text', chapter, verse);
      error = error || verifyNoAttribute(object, 'lemma', chapter, verse);
      error = error || verifyNoAttribute(object, 'morph', chapter, verse);
      error = error || verifyNoAttribute(object, 'strong', chapter, verse);
      error = error || verifyTwAttribute(object, chapter, verse);
      error = error || verifychildren(object, chapter, verse);
    }
    if (error) {
      errors++;
    }
  }
  return errors;
}

function validateUSFM3(json, errors) {
  for (let chapter in json.chapters) {
    if (!parseInt(chapter, 10)) {
      continue;
    }
    const chapterData = json.chapters[chapter];
    for (let verse in chapterData) {
      if (!parseInt(verse, 10)) {
        continue;
      }
      const verseObjects = chapterData[verse].verseObjects;
      errors = validateVerseObjects(verseObjects, chapter, verse, errors);
    }
  }
  return errors;
}

const roundTripTest = name => {
  console.log("Testing: " + name);
  const input = readUSFM(path.join('roundTrip', name));
  expect(input).toBeTruthy();
  const json = usfmToJSON(input);
  const usfm = jsonToUSFM(json);
  let errors = validateUSFM(usfm, input);
  errors = validateUSFM3(json, errors);
  expect(errors).toEqual(0);
};

