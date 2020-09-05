const Benchmark = require('benchmark');
const utils = require('../../build/utils');
const suite = new Benchmark.Suite;

// add tests
suite
  .add('getDownloadUrl', () => {
    utils.getDownloadUrl('http://example.com/', 'test.conf?foo=bar', undefined, 'abcd');
  })
  .add('getDownloadUrlOld', () => {
    utils.getDownloadUrlOld('http://example.com/', 'test.conf?foo=bar', undefined, 'abcd');
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ async: true });
