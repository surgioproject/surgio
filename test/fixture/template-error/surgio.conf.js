'use strict';

console.log(123);
module.exports = {
  artifacts: [
    {
      name: 'test.conf',
      template: 'test',
      provider: 'test',
    },
  ],
  urlBase: 'https://example.com/',
};
