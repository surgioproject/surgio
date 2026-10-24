'use strict';

module.exports = {
  url: 'http://example.com/clash-sample.yaml',
  type: 'clash',
  customFilters: {
    testFilter: node => node.nodeName.toLowerCase().includes('ss') || node.nodeName.toLowerCase().includes('us'),
  },
};
