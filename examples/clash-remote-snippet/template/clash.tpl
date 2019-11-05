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

{{ clashProxyConfig | yaml }}

Rule:
{{ remoteSnippets.netflix.main('🎬 Netflix') | patchYamlArray }}
{{ remoteSnippets.youtube.main('📺 Youtube') | patchYamlArray }}
{{ remoteSnippets.global.main('🚀 Proxy') | patchYamlArray }}

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
