'use strict';

module.exports = {
  url: 'http://example.com/clash-sample.yaml',
  type: 'clash',
  renameNode: name => {
    if (name.includes('ss1')) {
      return 'TEST ' + name;
    }
    return name;
  },
};
