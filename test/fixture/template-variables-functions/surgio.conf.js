'use strict';

module.exports = {
  artifacts: [
    {
      name: 'ss.conf',
      template: 'test',
      provider: 'ss',
    },
  ],
  remoteSnippets: [
    {
      name: 'netflix',
      url: '/netflix.list'
    }
  ],
  urlBase: 'https://example.com/',
};
