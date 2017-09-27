const removeMarker = require('../index').removeMarker;
const expect = require('chai').expect;
const fs = require('fs');

describe('removeMarker', function () {
  it('should remove all extra tags from a string', function (done) {
    let randomMarkerString = fs.readFileSync('./tests/static/footnotes.json').toString();
    expect(randomMarkerString).to.include('\\f');
    expect(randomMarkerString).to.include('\\q');
    let randomMarkerJSON = JSON.parse(randomMarkerString);
    var resultString = '';
    //Creating string of entire object for easier testing 
    for (var verse in randomMarkerJSON) {
      let regString = randomMarkerJSON[verse];
      //Removing all markers
      let fixedString = removeMarker(regString);
      resultString += fixedString + '\n';
    }
    expect(resultString).to.not.include('\\f');
    expect(resultString).to.not.include('\\q');
    expect(resultString).to.not.include('\\');
    expect(resultString).to.include('I pray that the eyes of your heart may be enlightened');
    done()
  });
  it('should remove f tags from a string', function (done) {
    let randomMarkerString = fs.readFileSync('./tests/static/footnotes.json').toString();
    expect(randomMarkerString).to.include('\\f');
    expect(randomMarkerString).to.include('\\q');
    let randomMarkerJSON = JSON.parse(randomMarkerString);
    var resultString = '';
    //Creating string of entire object for easier testing 
    for (var verse in randomMarkerJSON) {
      let regString = randomMarkerJSON[verse];
      //Only removing f markers
      let fixedString = removeMarker(regString, 'f');
      resultString += fixedString + '\n';
    }
    expect(resultString).to.not.include('\\f');
    expect(resultString).to.include('\\q');
    expect(resultString).to.include('\\');
    expect(resultString).to.include('I pray that the eyes \\q of your heart may be enlightened');
    done()
  });
  it('should remove q tags from a string', function (done) {
    let randomMarkerString = fs.readFileSync('./tests/static/footnotes.json').toString();
    expect(randomMarkerString).to.include('\\f');
    expect(randomMarkerString).to.include('\\q');
    let randomMarkerJSON = JSON.parse(randomMarkerString);
    var resultString = '';
    //Creating string of entire object for easier testing 
    for (var verse in randomMarkerJSON) {
      let regString = randomMarkerJSON[verse];
      //Only removing q markers
      let fixedString = removeMarker(regString, 'q');
      resultString += fixedString + '\n';
    }
    expect(resultString).to.include('\\f');
    expect(resultString).to.not.include('\\q');
    expect(resultString).to.include('\\');
    expect(resultString).to.include('I pray that the eyes of your heart may be enlightened,');
    done()
  });
});
