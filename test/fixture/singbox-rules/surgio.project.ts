import {
  combineExtendFunctions,
  defineCustomProvider,
  defineSurgioProject,
  extendOutbounds,
  extendRoute,
  extendRuleSet,
  NodeTypeEnum,
} from '../../../build/project/index.js'

const nodes = defineCustomProvider({
  nodeList: [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'US',
      hostname: 'us.example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'HK',
      hostname: 'hk.example.com',
      port: 443,
      method: 'chacha20-ietf-poly1305',
      password: 'password',
    },
  ],
})

export default defineSurgioProject({
  templateDir: './template',
  providers: { nodes },
  urlBase: 'http://example.com/',
  remoteSnippets: [
    { name: 'netflix', url: 'http://example.com/netflix.list' },
    { name: 'telegram', url: 'http://example.com/telegram.list' },
  ],
  artifacts: [
    {
      name: 'singbox.json',
      template: 'singbox',
      templateType: 'json',
      provider: 'nodes',
      extendTemplate: combineExtendFunctions(
        extendOutbounds(
          ({ getSingboxNodes, getSingboxNodeNames, nodeList }) => [
            {
              type: 'selector',
              tag: 'proxy',
              outbounds: getSingboxNodeNames(nodeList),
            },
            ...getSingboxNodes(nodeList),
          ],
        ),
        extendRoute(({ getSingboxRules, getUrl, remoteSnippets, snippet }) => ({
          rule_set: [
            {
              tag: 'netflix',
              type: 'remote',
              format: 'source',
              url: getUrl('ruleset/netflix.json'),
            },
          ],
          rules: [
            { rule_set: ['netflix'], outbound: 'proxy' },
            ...getSingboxRules(remoteSnippets.telegram.main('proxy')),
            ...getSingboxRules(snippet('snippet/direct.tpl').text, 'direct'),
            ...getSingboxRules('DOMAIN-SUFFIX,ads.example.com,REJECT'),
          ],
          final: 'proxy',
        })),
      ),
    },
    {
      name: 'ruleset/netflix.json',
      template: 'singbox-ruleset',
      templateType: 'json',
      provider: 'nodes',
      extendTemplate: extendRuleSet(
        ({ getSingboxHeadlessRules, remoteSnippets }) =>
          getSingboxHeadlessRules(remoteSnippets.netflix.text),
      ),
    },
    {
      name: 'singbox-filter.json',
      template: 'singbox-filter',
      provider: 'nodes',
    },
  ],
})

export const nodeOptions = async () => ({
  output: './dist',
})
