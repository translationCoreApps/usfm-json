const {usfmToJSON} = require('./src/js/usfmToJson');
const {jsonToUSFM} = require('./src/js/jsonToUsfm');
const {removeMarker} = require('./src/js/filter');

exports.toJSON = usfmToJSON;
exports.toUSFM = jsonToUSFM;
exports.removeMarker = removeMarker;
