[![Build Status](https://api.travis-ci.org/translationCoreApps/usfm-js.svg?branch=master)](https://travis-ci.org/translationCoreApps/usfm-js) 
[![npm](https://img.shields.io/npm/dt/usfm-js.svg)](https://www.npmjs.com/package/usfm-js)
[![npm](https://img.shields.io/npm/v/usfm-js.svg)](https://www.npmjs.com/package/usfm-js)
[![codecov](https://codecov.io/gh/translationCoreApps/usfm-js/branch/master/graph/badge.svg)](https://codecov.io/gh/translationCoreApps/usfm-js)

# usfm-js
This library takes in USFM text, and outputs it into a JSON format.
It also takes JSON formatted scripture and outputs it into USFM.

## Setup
`npm install usfm-js`

## Usage
```js
var usfm = require('usfm-js');
//Convert from USFM to JSON
var toJSON = usfm.toJSON(/**USFM Text**/);

//JSON to USFM
var toUSFM = usfm.toUSFM(toJSON, {forcedNewLines: true}); // if forcedNewLines is true, then USFM word and alignment markers will start on new line (defaults to false)
```

## DOCUMENTATION
 - Expected format for usfm is standard \h \id \c \p \v
   - More here: http://ubsicap.github.io/usfm/
 - Expected format for JSON is the same as when exported from USFM
   - ```js
      {
        1:{
            1: "This is the first verse",
            2: "This is the second verse",
            ...
          },
         2:{
            1: "This is the first verse of the second chapter",
            2: "This is the second verse of the second chapter",
            ...
           }
      }
      ```


### DEVELOPMENT
- Make sure unit tests pass:

  - `npm i`
  - `npm test`
