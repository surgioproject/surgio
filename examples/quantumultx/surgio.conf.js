'use strict';

const { utils } = require('surgio');

module.exports = {
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
};
