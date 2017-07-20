[![Build Status](https://api.travis-ci.org/translationCoreApps/usfm-json.svg?branch=master)](https://travis-ci.org/translationCoreApps/usfm-json) 
[![npm](https://img.shields.io/npm/dt/usfm-json.svg)](https://www.npmjs.com/package/usfm-json)
[![npm](https://img.shields.io/npm/v/usfm-json.svg)](https://www.npmjs.com/package/usfm-json)

# usfm-json
This library takes in USFM text, and outputs it into a JSON format.
It also takes JSON formatted scripture and outputs it into USFM.
## Setup
`npm install usfm-json`

## Usage
```js
var usfm = require('usfm-json');
//Convert from USFM to JSON
var toJSON = usfm.toJSON(/**USFM Text**/);
//JSON to USFM
var toUSFM = usfm.toUSFM(toJSON);
```

## USFM DOCUMENTATION
http://ubsicap.github.io/usfm/
