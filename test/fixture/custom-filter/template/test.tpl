#!MANAGED-CONFIG {{ downloadUrl }} interval=43200 strict=false

[Proxy]
{{ getSurgeNodes(nodeList) }}

[Proxy Group]
Proxy 1 = select, {{ getNodeNames(nodeList, ['shadowsocks'], customFilters.keywordFilter) }}
Proxy 2 = select, {{ getNodeNames(nodeList, ['shadowsocks'], customFilters.strictKeywordFilter) }}
