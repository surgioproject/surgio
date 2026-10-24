#!MANAGED-CONFIG {{ downloadUrl }} interval=43200 strict=false

[Proxy]
{{ getSurgeNodes(nodeList) }}

[Proxy Group]
Proxy = select, {{ getNodeNames(nodeList }}
