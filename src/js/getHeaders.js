/** ***********************************************************************
 * @author unfoldingword
 * @description Gets the headers from a USFM file
 * @param {string} usfmInput - A string in the USFM format
 * @return {Object} - An object that contains the headers
*************************************************************************/
function getHeaders(usfmInput) {
  var usfm = usfmInput.replace(/\\s5|\\p/g, "");
  var header = {};
  var heading = usfm.split("\\c ")[0];
  var headers = heading.split('\\');
  for (var i in headers) {
    var executed = /(\w+\s)(.+)/.exec(headers[i]);
    if (executed) {
      header[executed[1].trim()] = executed[2].trim();
    }
  }
  return header;
}

module.exports = getHeaders;
