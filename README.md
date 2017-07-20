[![Build Status](https://api.travis-ci.org/translationCoreApps/usfm-js.svg?branch=master)](https://travis-ci.org/translationCoreApps/usfm-js) 
[![npm](https://img.shields.io/npm/dt/usfm-js.svg)](https://www.npmjs.com/package/usfm-js)
[![npm](https://img.shields.io/npm/v/usfm-js.svg)](https://www.npmjs.com/package/usfm-js)

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
var toUSFM = usfm.toUSFM(toJSON);
```

## USFM DOCUMENTATION
http://ubsicap.github.io/usfm/
