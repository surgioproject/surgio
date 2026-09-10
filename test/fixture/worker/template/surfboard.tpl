[Proxy]
{{ getSurfboardNodes(nodeList) }}

[Proxy Group]
Proxy = select, {{ getSurfboardNodeNames(nodeList) }}

{{ getSurfboardWireguardNodes(nodeList) }}
