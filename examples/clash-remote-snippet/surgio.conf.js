'use strict';

module.exports = {
  remoteSnippets: [
    {
      name: 'youtube',
      url:
        'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/YouTube.list',
    },
    {
      name: 'global',
      url:
        'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Global.list',
    },
    {
      name: 'netflix',
      url:
        'https://raw.githubusercontent.com/ConnersHua/Profiles/master/Surge/Ruleset/Media/Netflix.list',
    },
  ],
  artifacts: [
    {
      name: 'Clash.yaml',
      template: 'clash',
      provider: 'demo',
    },
    {
      name: 'Clash_enhanced_mode.yaml',
      template: 'clash',
      provider: 'demo',
      customParams: {
        enhancedMode: true,
      },
    },
  ],
  urlBase: 'https://config.example.com/',
  // https://surgio.royli.dev/guide/custom-config.html#upload
  // upload: {},
};
