{{ getSurgeNodes(nodeList) }}
----
{{ clashProxyConfig | yaml }}
----
{{ getNodeNames(nodeList, customFilters.hkFirstUsSecondFilter) }}
----
{{ getQuantumultXNodes(nodeList, customFilters.hkFirstUsSecondFilter) }}
----
{{ getNodeNames(nodeList, customFilters.providerFilter) }}
----
{{ getClashNodeNames(nodeList, customFilters.providerFilter) | json }}
