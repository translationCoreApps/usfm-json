var usfmToJson = require('./src/js/usfmToJson.js').usfmToJSON;
var jsonToUsfm = require('./src/js/jsonToUsfm.js').jsonToUSFM;
var getHeaders = require('./src/js/getHeaders.js');
var filter = require('./src/js/filter');

exports.toJSON = usfmToJson;
exports.toUSFM = jsonToUsfm;
exports.getHeaders = getHeaders;
exports.removeMarker = filter.removeMarker;