# TrustTunnel cross-client configuration research

This note records the official behavior used by Surgio's shared TrustTunnel
node model.

## Sources

- [Surge proxy policy](https://manual.nssurge.com/policy/proxy.html)
- [Stash TrustTunnel proxy type](https://stash.wiki/proxy-protocols/proxy-types#trusttunnel)
- [Mihomo TrustTunnel proxy](https://wiki.metacubex.one/config/proxies/trusttunnel/)
- [TrustTunnel protocol](https://github.com/TrustTunnel/TrustTunnel/blob/master/PROTOCOL.md)
- [Mihomo TrustTunnel source](https://github.com/MetaCubeX/mihomo/blob/Meta/adapter/outbound/trusttunnel.go)

## Shared model

All three clients connect to a TrustTunnel endpoint with a username and
password. Unlike MASQUE, no authentication-mode discriminator is required.

The shared transport switch is `quic?: boolean`:

- Omitted or `false` selects HTTP/2 over TLS.
- `true` selects HTTP/3 over QUIC in Stash and Mihomo.
- Surge currently supports only HTTP/2/TCP. A QUIC node must be omitted from
  Surge output rather than silently downgraded.

An explicit ALPN override must contain `h2` in HTTP/2 mode or `h3` in QUIC
mode. The upstream TrustTunnel protocol imposes the same transport-specific
ALPN requirements.

## Target mapping

| Surgio field | Surge | Stash | Mihomo |
| --- | --- | --- | --- |
| `type` | `trust-tunnel` | `trusttunnel` | `trusttunnel` |
| `nodeName` | policy name | `name` | `name` |
| `hostname` | positional host | `server` | `server` |
| `port` | positional port | `port` | `port` |
| `username` | `username` | `username` | `username` |
| `password` | `password` | `password` | `password` |
| `quic` | unsupported when true | `quic` | `quic` |
| `sni` | `sni` | `sni` | `sni` |
| `alpn` | `alpn` | `alpn` | `alpn` |
| `skipCertVerify` | `skip-cert-verify` | same | same |
| `serverCertFingerprintSha256` | `server-cert-fingerprint-sha256` | `server-cert-fingerprint` | `fingerprint` |
| `underlyingProxy` | `underlying-proxy` | `dialer-proxy` | `dialer-proxy` |
| `portHopping` | unsupported | `ports`, QUIC only | unsupported |
| `portHoppingInterval` | unsupported | `hop-interval`, QUIC only | unsupported |
| `udpRelay` | unsupported | no switch | `udp` |
| `headers` | `headers` | unsupported | unsupported |
| `maxStreams` | `max-streams` | unsupported | `max-streams` |
| `maxConnections` / `minStreams` | unsupported | unsupported | same names |
| `healthCheck` | unsupported | unsupported | `health-check` |
| `nameCertVerify` | unsupported | unsupported | `name-cert-verify` |
| `congestionController` / `bbrProfile` | unsupported | unsupported | same names |

Surge supports custom handshake headers separated by semicolons and a
`max-streams` reuse limit. It does not support TrustTunnel UDP forwarding.
Because its TrustTunnel transport is TCP-based, Surge may combine it with
Shadow TLS.

Stash exposes QUIC port hopping through its common `ports` and `hop-interval`
fields. `dialer-proxy` and `interface-name` are mutually exclusive in Stash.

Mihomo documents `udp`, `health-check`, QUIC congestion control, and connection
reuse. `max-streams` conflicts with both `max-connections` and `min-streams`.
The undocumented `cwnd`, ECH, and mTLS source fields are intentionally outside
the initial public model.

## Version floors

- Surge TrustTunnel: Mac 6.4.4+. Headers and `max-streams`: Mac 6.6.0+.
  Custom ALPN: Mac 6.7.0+. The official manual does not provide an iOS floor.
- Stash TrustTunnel: iOS 3.4.0+ and macOS 4.2.0+. The official tvOS release
  notes do not provide a reliable floor.
- Mihomo TrustTunnel: v1.19.21+. Connection reuse fields: v1.19.23+.
  `bbr-profile`: v1.19.24+.

These versions are documented rather than enforced because Surgio has no
target-version setting for these clients.
