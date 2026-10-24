allow-lan: true
mode: Rule
external-controller: 127.0.0.1:7892
port: 7890
socks-port: 7891
{% if customParams.enhancedMode %}
dns:
  enable: true
  ipv6: false
  listen: 0.0.0.0:53
  enhanced-mode: fake-ip
  nameserver:
  - 119.29.29.29
  - 223.5.5.5
{% endif %}

Proxy: {{ getClashNodes(nodeList) | json }}

Proxy Group:
- type: select
  name: 🚀 Proxy
  proxies: {{ getClashNodeNames(nodeList) | json }}
- type: select
  name: 🎬 Netflix
  proxies: {{ getClashNodeNames(nodeList, netflixFilter) | json }}
- type: select
  name: 📺 Youtube
  proxies: {{ getClashNodeNames(nodeList) | json }}
- type: url-test
  name: US
  proxies: {{ getClashNodeNames(nodeList, usFilter) | json }}
  url: {{ proxyTestUrl }}
  interval: 1200
- type: url-test
  name: HK
  proxies: {{ getClashNodeNames(nodeList, hkFilter) | json }}
  url: {{ proxyTestUrl }}
  interval: 1200
- type: select
  name: 🍎 Apple
  proxies: ['DIRECT', '🚀 Proxy', 'US', 'HK']
- type: select
  name: 🍎 Apple CDN
  proxies: ['DIRECT', '🍎 Apple']

Rule:
{% filter clash %}
{{ remoteSnippets.netflix.main('🎬 Netflix') }}
{{ remoteSnippets.youtube.main('📺 Youtube') }}
{{ remoteSnippets.global.main('🚀 Proxy') }}
{% endfilter %}

# LAN
- DOMAIN-SUFFIX,local,DIRECT
- IP-CIDR,127.0.0.0/8,DIRECT
- IP-CIDR,172.16.0.0/12,DIRECT
- IP-CIDR,192.168.0.0/16,DIRECT
- IP-CIDR,10.0.0.0/8,DIRECT
- IP-CIDR,17.0.0.0/8,DIRECT
- IP-CIDR,100.64.0.0/10,DIRECT

# Final
- GEOIP,CN,DIRECT
- MATCH,🚀 Proxy
