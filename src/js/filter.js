
/* Method to filter specified usfm marker from a string
 * @param {string} string - The string to remove specfic marker from
 * @param {string} type - The type of marker to remove i.e. f | h
 * Note: if no type is given all markers are removed
 */
module.exports.removeMarker = function(string = '', type) {
  const typeRegex = type ? '\\' + type : '\\';
  const regString = '\\' + typeRegex + '\\w*\\**\\s*\\+?\\s*';
  const regex = new RegExp(regString, 'g');
  return string.replace(regex, '');
};
