'use strict';

const { utils } = require('surgio');

module.exports = {
  remoteSnippets: [
    {
      name: 'youtube',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/YouTube.list',
    },
    {
      name: 'global',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Global.list',
    },
    {
      name: 'netflix',
      url: 'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/Netflix.list',
    },
  ],
  artifacts: [
    {
      name: 'QuantumultX_rules.conf',
      template: 'quantumultx_rules',
      provider: 'demo',
    },
    {
      name: 'QuantumultX.conf',
      template: 'quantumultx',
      provider: 'demo',
    },
    {
      name: 'Quantumult_subscribe_us.conf',
      template: 'quantumult_subscribe',
      provider: 'demo',
      customParams: {
        magicVariable: utils.usFilter,
      },
    },
    {
      name: 'Quantumult_subscribe_hk.conf',
      template: 'quantumult_subscribe',
      provider: 'demo',
      customParams: {
        magicVariable: utils.hkFilter,
      },
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.royli.dev/guide/custom-config.html#upload
  // upload: {},
};
