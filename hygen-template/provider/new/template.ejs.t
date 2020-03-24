---
to: provider/<%= name %>.js

---
'use strict';

const { utils } = require('surgio');

module.exports = {
  type: '<%= type %>',
<% if (url) { -%>
  url: '<%= url %>',
<% } -%>
<% if (type === 'custom') { -%>
  nodeList: [],
<% } -%>
<% if (addFlag === true) { -%>
  addFlag: true,
<% } -%>
<% if (udpRelay === true) { -%>
  udpRelay: true,
<% } -%>
<% if (relayUrl === true) { -%>
  relayUrl: true,
<% } -%>
};

