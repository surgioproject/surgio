# MASQUE node specifications across Surge, Stash, and Mihomo

Research date: 2026-08-11

Primary sources:

- [Surge MASQUE policy](https://manual.nssurge.com/policies/masque.html)
- [Surge common policy parameters](https://manual.nssurge.com/policies/parameters.html)
- [Surge TLS parameters](https://manual.nssurge.com/policies/tls.html)
- [Surge UDP relay](https://manual.nssurge.com/policies/udp.html)
- [Stash MASQUE proxy type](https://stash.wiki/en/proxy-protocols/proxy-types#masque)
- [Mihomo MASQUE proxy](https://wiki.metacubex.one/en/config/proxies/masque/)
- [Mihomo v1.19.20 release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.20)
- [Mihomo v1.19.24 release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.24)
- [Mihomo v1.19.28 release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.28)

## The protocols are not configuration-compatible

The three clients use the name `masque` for two materially different deployment models:

| Client/core | Documented model | Authentication and addressing |
| --- | --- | --- |
| Surge | Standards-compliant HTTP/3 CONNECT for TCP and CONNECT-UDP with HTTP Datagrams | Optional HTTP Basic `username`/`password`; no client tunnel address or key pair |
| Stash | Cloudflare WARP-style CONNECT-IP over HTTP/3 or HTTP/2 | P-256 client private key, endpoint public key, and at least one IPv4/IPv6 tunnel address |
| Mihomo | WARP-style IP tunnel, with QUIC, HTTP/2, and H3 L4 proxy modes | ECDSA client private key and server public key; optional IPv4/IPv6 tunnel addresses depending on mode |

There is no lossless field-for-field mapping between the Surge credentials and the Stash/Mihomo credentials. A custom-node model intended to generate all three must represent both credential families and omit or reject fields according to the output target. [Surge source](https://manual.nssurge.com/policies/masque.html), [Stash source](https://stash.wiki/en/proxy-protocols/proxy-types#masque), [Mihomo source](https://wiki.metacubex.one/en/config/proxies/masque/)

## Surge

### Availability and declaration

MASQUE policies require Surge iOS 5.22.0+ or Surge Mac 6.9.0+. Surge describes MASQUE as HTTP/3 CONNECT tunnels for TCP, multiplexed over one QUIC connection, and CONNECT-UDP with HTTP Datagrams for UDP. Standards-compliant MASQUE servers are supported. [Source](https://manual.nssurge.com/policies/masque.html)

```ini
[Proxy]
Proxy-MASQUE = masque, example.com, 443, username=user, password=pass
```

The formal declaration is:

```text
Name = masque, <host>, <port>[, parameter=value, ...]
```

Therefore `host` and `port` are positional and required; all parameters below are appended as `key=value` entries. [Source](https://manual.nssurge.com/policies/masque.html)

### MASQUE-specific parameters

| Surge key | Required | Accepted value / default | Behavior |
| --- | --- | --- | --- |
| `username` | No | String; no default documented | Together with `password`, supplies HTTP Basic credentials on every CONNECT request. |
| `password` | No | String; no default documented | When credentials are omitted, Surge sends no Authorization header. The manual does not document whether only one of `username` and `password` may be supplied, so Surgio should not invent a pairing rule without a tested Surge behavior. |
| `port-hopping` | No | Semicolon-separated ports and/or inclusive-looking ranges, e.g. `1234;5000-6000`; no default | Surge periodically rotates among these ports. When present, the positional main port is ignored. It cannot be combined with `underlying-proxy`. The manual does not state port/range bounds or ordering rules. |
| `port-hopping-interval` | No | Seconds; default `30` | Controls how often Surge rotates among the configured hopping ports. The manual does not state integer/range constraints or whether the key has an effect without `port-hopping`. |

All claims in this table come from the [MASQUE policy page](https://manual.nssurge.com/policies/masque.html).

### UDP and protocol constraints

- UDP relay is automatic for MASQUE; do **not** emit `udp-relay=true`. The server must advertise extended CONNECT and HTTP Datagrams, which Surge validates when establishing the connection. The UDP support table separately lists MASQUE as supported and limits the `udp-relay` switch to other protocols. [MASQUE source](https://manual.nssurge.com/policies/masque.html), [UDP source](https://manual.nssurge.com/policies/udp.html)
- MASQUE's default ALPN is `h3`. The `alpn` parameter overrides it. [Source](https://manual.nssurge.com/policies/masque.html)
- Because MASQUE is QUIC-based, ECN is enabled by default on supported systems. The common `ecn` parameter can override the applicable default. [MASQUE source](https://manual.nssurge.com/policies/masque.html), [common parameter source](https://manual.nssurge.com/policies/parameters.html#ecn-ios-580-mac-540)
- Shadow TLS cannot be combined with MASQUE or other QUIC-based protocols. [Source](https://manual.nssurge.com/policies/masque.html)
- `port-hopping` and `underlying-proxy` are mutually exclusive. [MASQUE source](https://manual.nssurge.com/policies/masque.html), [common parameter source](https://manual.nssurge.com/policies/parameters.html#underlying-proxy)

### Shared parameters applicable to MASQUE

The common-parameters page says its `key=value` parameters may be appended to any policy line. The MASQUE page also directly points to the common and TLS parameter pages. [Source](https://manual.nssurge.com/policies/parameters.html)

#### Common policy parameters

| Surge key | Accepted value / default |
| --- | --- |
| `interface` | Network interface name; default automatic |
| `allow-other-interface` | Boolean; default `false` |
| `dns-follow-interface` | Boolean; default `false`; iOS 5.15.2+ / Mac 5.2.0+ |
| `no-error-alert` | Boolean; default `false` |
| `ip-version` | `dual`, `v4-only`, `v6-only`, `prefer-v4`, or `prefer-v6`; default `dual` |
| `hybrid` | iOS only; `auto`, `on`, or `off`; default `auto`; `true`/`false` are also accepted |
| `tfo` | Boolean; default `false` (documented globally, though MASQUE itself uses QUIC rather than TCP for the server transport) |
| `tos` | Decimal `0`-`255` or `0x` hexadecimal; default `0` |
| `ecn` | `auto`, `on`, or `off`; default `auto`; `true`/`false` explicitly override the applicable default |
| `block-quic` | `auto`, `on`, or `off`; default `auto` |
| `test-url` | HTTP(S) URL; defaults to the global proxy/internet test URL |
| `test-timeout` | Seconds; defaults to the global test timeout |
| `test-udp` | `hostname@ipv4`; defaults to global `proxy-test-udp` |
| `underlying-proxy` | Name of another proxy policy or policy group; incompatible with `port-hopping` |

See the [common policy parameters page](https://manual.nssurge.com/policies/parameters.html) for behavior details. When `underlying-proxy` is used, resolution of the MASQUE host occurs remotely and `ip-version` has no effect.

#### TLS parameters

| Surge key | Accepted value / default |
| --- | --- |
| `skip-cert-verify` | Boolean; default `false` |
| `sni` | Hostname or `off`; default is the proxy hostname |
| `server-cert-verify-name` | Hostname; iOS 5.21.0+ / Mac 6.8.0+ |
| `server-cert-fingerprint-sha256` | Exactly 64 hexadecimal characters |
| `alpn` | Comma-separated protocol list; quote multiple entries; MASQUE default is `h3` |
| `client-cert` | Name of an item in `[Keystore]` |

These values are documented on the [TLS parameters page](https://manual.nssurge.com/policies/tls.html); the MASQUE page explicitly identifies `skip-cert-verify`, `sni`, `alpn`, and certificate pinning as shared options.

## Stash

Stash supports MASQUE on iOS/tvOS 3.6+ and macOS 4.4+. Its documented implementation is Cloudflare WARP CONNECT-IP, carrying TCP and UDP over HTTP/3 or HTTP/2. [Source](https://stash.wiki/en/proxy-protocols/proxy-types#masque)

```yaml
- name: WARP-MASQUE
  type: masque
  server: 162.159.198.1
  port: 443
  private-key: 'BASE64_ENCODED_P256_SEC1_PRIVATE_KEY'
  public-key: 'BASE64_ENCODED_P256_SPKI_PUBLIC_KEY'
  ip: 172.16.0.2/32
  # ipv6: '2606:4700:110:84c0::2/128'
  # dns: [1.1.1.1, '2606:4700:4700::1111']
  # network: h3
  # sni: consumer-masque.cloudflareclient.com
  # connect-uri: https://cloudflareaccess.com
  # mtu: 1280
  # keepalive: 30
```

| Stash key | Requirement | Accepted value / default |
| --- | --- | --- |
| `name` | Required by Stash's general proxy schema | Unique string |
| `type` | Required | Literal `masque` |
| `server` | Core input; no default documented | Hostname or IP address |
| `port` | Core input; no default documented | Port number |
| `private-key` | Core input; no default documented | Base64-encoded P-256 SEC1 private-key DER |
| `public-key` | Core input; no default documented | Base64-encoded P-256 SPKI endpoint public-key DER, used to verify the server |
| `ip` | At least one of `ip`/`ipv6` required | IPv4 address, optionally with CIDR prefix |
| `ipv6` | At least one of `ip`/`ipv6` required | IPv6 address, optionally with CIDR prefix |
| `dns` | Optional | One IP or an array; omitted defaults are `1.1.1.1` for IPv4 and `2606:4700:4700::1111` for IPv6 |
| `network` | Optional | `h3` or `h2`; default `h3` |
| `sni` | Optional | Server name; default `consumer-masque.cloudflareclient.com` |
| `connect-uri` | Optional | Absolute HTTPS URL; default `https://cloudflareaccess.com` |
| `mtu` | Optional | Integer `1280`-`1500`; default `1280` |
| `keepalive` | Optional | Seconds; default `30` |

The Stash page explicitly requires at least one of `ip` and `ipv6`, but does not label `server`, `port`, `private-key`, or `public-key` with required/optional prose. They are uncommented core fields in the canonical example and have no documented defaults; this note does not claim a stronger validation rule than the official page states. [Source](https://stash.wiki/en/proxy-protocols/proxy-types#masque)

The page's general QUIC section documents `ports` and `hop-interval`, but the MASQUE section does not list them. Treat Stash port hopping for MASQUE as undocumented rather than assuming it from the general statement.

## Mihomo / Clash Meta

Mihomo added MASQUE outbound support in v1.19.20. This is a Mihomo (`clashCore: 'clash.meta'`) feature, not a legacy Clash feature. The current proxy page itself does not show a version floor; the minimum comes from the official v1.19.20 release note. [Documentation](https://wiki.metacubex.one/en/config/proxies/masque/), [release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.20)

```yaml
- name: masque
  type: masque
  server: server.com
  port: 443
  private-key: BASE64_ENCODED_PRIVATE_KEY
  public-key: BASE64_ENCODED_PUBLIC_KEY
  ip: 172.16.0.2/32
  ipv6: fd00::2/128
  mtu: 1280
  udp: true
  # sni: example.com
  # dialer-proxy: ss1
  # remote-dns-resolve: true
  # dns: [1.1.1.1, 8.8.8.8]
  # congestion-controller: bbr
  # bbr-profile: standard
  # handshake-timeout: 30
```

| Mihomo key | Requirement | Accepted value / default |
| --- | --- | --- |
| `name` | Required common field | String |
| `type` | Required | Literal `masque` |
| `server` | Required common field | Hostname or IP address |
| `port` | Required common field | Port number |
| `private-key` | Required | Base64-encoded ECDSA private key |
| `public-key` | Required | Base64-encoded ECDSA server public key; remove PEM header/footer markers and line breaks |
| `ip` | Optional in the documented H3 L4 proxy example | Local IPv4 CIDR, e.g. `172.16.0.2/32` |
| `ipv6` | Optional in the documented H3 L4 proxy example | Local IPv6 CIDR, e.g. `fd00::2/128` |
| `mtu` | Optional | TUN MTU; default `1280` |
| `udp` | Optional | Boolean; default `false` |
| `sni` | Example-only; requirement/default not documented | Hostname |
| `dialer-proxy` | Example-only common field | Outbound proxy name; non-empty sends the connection through that proxy |
| `remote-dns-resolve` | Optional | Boolean; example documents default `false` |
| `dns` | Optional | DNS server list; only effective with `remote-dns-resolve=true` |
| `congestion-controller` | Optional | Disabled by default; documented available value includes `bbr` |
| `bbr-profile` | Optional; Mihomo 1.19.24+ | `standard`, `conservative`, or `aggressive`; default `standard` |
| `network` | Optional | `quic` (default), `h2` (1.19.24+), or `h3-l4proxy` (1.19.28+) |
| `handshake-timeout` | Optional; Mihomo 1.19.28+ | Seconds; default `0`, meaning only the outer connection timeout applies |

Mode constraints:

- `h3-l4proxy` currently does not support UDP, so its example sets `udp: false`. [Documentation](https://wiki.metacubex.one/en/config/proxies/masque/), [v1.19.28 release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.28)
- HTTP/2 mode and `bbr-profile` were added in Mihomo v1.19.24. [Release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.24)
- H3 L4 proxy mode and `handshake-timeout` were added in Mihomo v1.19.28. [Release](https://github.com/MetaCubeX/mihomo/releases/tag/v1.19.28)
- The official docs do not document Surge-style Basic authentication or MASQUE port hopping for Mihomo.

## Cross-client field mapping

| Surgio concept | Surge output | Stash output | Mihomo output | Mapping status |
| --- | --- | --- | --- | --- |
| Name | Policy name before `=` | `name` | `name` | Direct |
| Type | Positional `masque` | `type: masque` | `type: masque` | Direct |
| Server | Positional host | `server` | `server` | Direct |
| Port | Positional port | `port` | `port` | Direct |
| Basic auth | `username`, `password` | None documented | None documented | Surge-only |
| Client private key | None documented | `private-key` (P-256 SEC1 DER) | `private-key` (ECDSA) | Stash/Mihomo only; encoding requirements differ in specificity |
| Server public key | None documented | `public-key` (P-256 SPKI DER) | `public-key` (ECDSA, no PEM wrapper/newlines) | Stash/Mihomo only |
| Tunnel IPv4/IPv6 | None documented | `ip`, `ipv6`; at least one | `ip`, `ipv6` | CONNECT-IP only |
| UDP | Automatic, no parameter | Automatic tunnel capability, no MASQUE-specific switch documented | `udp`, default `false`; unsupported by `h3-l4proxy` | Semantics differ |
| Transport | HTTP/3; `alpn` default `h3` | `network: h3|h2`, default `h3` | `network: quic|h2|h3-l4proxy`, default `quic` | Client-specific enum/default |
| SNI | `sni`; default proxy hostname | `sni`; default Cloudflare consumer hostname | `sni`; default undocumented | Same concept, different defaults |
| MTU | None documented | `mtu` `1280`-`1500`, default `1280` | `mtu`, default `1280` | CONNECT-IP only |
| DNS through tunnel | `test-udp` only tests relay; not a tunnel DNS setting | `dns`, with Cloudflare defaults | `remote-dns-resolve` plus `dns` | Not equivalent |
| Upstream proxy | `underlying-proxy` | None documented in MASQUE section | `dialer-proxy` | Surge/Mihomo naming; Surge conflicts with hopping |
| Port hopping | `port-hopping`, `port-hopping-interval` | Not documented in MASQUE section | Not documented | Surge-only by protocol docs |
| Certificate bypass/pinning | Shared TLS parameters | Not documented in MASQUE section; endpoint key verifies identity | Server public key verifies identity | Do not map mechanically |
| Congestion control | `ecn` controls ECN behavior | None documented in MASQUE section | `congestion-controller`, `bbr-profile` | Different mechanisms |
| Request URI | Not configurable | `connect-uri` | Not documented | Stash-only |
| Keepalive | Not MASQUE-specific | `keepalive` | Not documented | Stash-only |

## Surgio custom-node implications

A minimal custom node should map naturally to:

```js
{
  type: 'masque',
  authMode: 'basic-auth',
  nodeName: 'Proxy-MASQUE',
  hostname: 'example.com',
  port: 443,
  username: 'user', // optional
  password: 'pass', // optional
}
```

The existing Surgio naming convention implies these additional mappings:

| Custom-node property | Surge output |
| --- | --- |
| `portHopping` | `port-hopping` (normalize comma-separated input to Surge's semicolon syntax, as existing shared validation already does) |
| `portHoppingInterval` | `port-hopping-interval` |
| `underlyingProxy` | `underlying-proxy` |
| `skipCertVerify` | `skip-cert-verify` |
| `serverCertFingerprintSha256` | `server-cert-fingerprint-sha256` |
| `testUrl` | `test-url` |
| `testTimeout` | `test-timeout` |
| `blockQuic` | `block-quic` |
| `ecn`, `sni`, `alpn` | Same Surge keys |

For Surge-only support, a MASQUE validator can reuse the TLS node base plus optional `username` and `password`, while the Surge formatter emits `nodeName = masque, hostname, port` and then the authentication/shared fields. Existing shared code does not currently emit `alpn` for arbitrary TLS node types, so MASQUE must be included explicitly for ALPN overrides.

For Stash and Mihomo support, the custom node uses `authMode: 'key-pair'` with `privateKey`, `publicKey`, `ip`, `ipv6`, `mtu`, and target-specific options. `authMode` is the discriminator, so validation never requires Surge Basic credentials and CONNECT-IP keys at the same time. Output support is explicit by target:

- `clashCore: 'stash'`: require the Stash-compatible key/address shape, especially at least one of `ip`/`ipv6`.
- `clashCore: 'clash.meta'`: require `privateKey` and `publicKey`; gate newer modes/options by the documented Mihomo version if Surgio exposes a target-version concept.
- `clashCore: 'clash'`: omit the node with the existing unsupported-node warning; legacy Clash has no documented MASQUE support.

Existing Surgio types also do not expose every currently documented Surge common/TLS parameter (`allow-other-interface`, `dns-follow-interface`, `no-error-alert`, `tos`, `hybrid`, `test-udp`, `server-cert-verify-name`, and `client-cert`); adding those globally is broader than MASQUE support and should be a deliberate scope choice rather than an undocumented requirement.
