var usfmToJson = require('./src/js/usfmToJson.js').usfmToJSON;
var jsonToUsfm = require('./src/js/jsonToUsfm.js').jsonToUSFM;
var filter = require('./src/js/filter');

exports.toJSON = usfmToJson;
exports.toUSFM = jsonToUsfm;
exports.removeMarker = filter.removeMarker;