{{ getSurgeNodes(nodeList) }}
----
{{ getNodeNames(nodeList, customFilters.keywordFilter) }}
----
{{ getNodeNames(nodeList, customFilters.strictKeywordFilter) }}
----
{{ getNodeNames(nodeList, customFilters.globalKeywordFilter) }}
----
{{ clashProxyConfig | yaml }}
----
{{ getSurgeNodes(nodeList, customFilters.sortFilter) }}
----
{{ getNodeNames(nodeList, customFilters.sortFilter) }}
