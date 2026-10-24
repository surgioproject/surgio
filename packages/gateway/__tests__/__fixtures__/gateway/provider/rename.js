'use strict';

module.exports = {
  url: 'http://example.com/test-ss-sub.txt',
  type: 'shadowsocks_subscribe',
  addFlag: true,
  renameNode: name => {
    return 'TEST ' + name;
  },
};
