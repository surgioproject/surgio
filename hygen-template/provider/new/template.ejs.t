---
to: provider/<%= name %>.js

---
const { utils } = require('surgio');

module.exports = {
  type: '<%= type %>',
<% if (typeof url !== 'undefined') { -%>
  url: '<%= url %>',
<% } -%>
<% if (type === 'custom') { -%>
  nodeList: [],
<% } -%>
<% if (addFlag === true) { -%>
  addFlag: true,
<% } -%>
<% if (typeof udpRelay !== 'undefined' && udpRelay === true) { -%>
  udpRelay: true,
<% } -%>
<% if (typeof relayUrl === 'string') { -%>
  relayUrl: '<%= relayUrl %>',
<% } -%>
};

