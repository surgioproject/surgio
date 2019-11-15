{{ getSurgeNodes(nodeList) }}
----
{{ getNodeNames(nodeList, customFilters.keywordFilter) }}
----
{{ getNodeNames(nodeList, customFilters.strictKeywordFilter) }}
----
{{ getNodeNames(nodeList, customFilters.globalKeywordFilter) }}
----
{{ clashProxyConfig | yaml }}