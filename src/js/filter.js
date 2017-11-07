
/* Method to filter specified usfm marker from a string
 * @param {string} string - The string to remove specfic marker from
 * @param {string} type - The type of marker to remove i.e. f | h. If no type is given all markers are removed
 * @return {string}
 */
export const removeMarker = (string = '', type) => {
  const typeRegex = type ? '\\' + type : '\\';
  const regStringPart = '\\' + typeRegex + '\\w*\\**\\s*\\+?\\s*';
  const regStringEntire = regStringPart + '.*' + regStringPart;
  const regex = new RegExp(regStringEntire, 'g');
  return string.replace(regex, '');
};
