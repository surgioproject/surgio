---
title: Surfboard proxy configuration research
pagination_prev: null
pagination_next: null
---

# Surfboard proxy configuration research

This note records the official configuration behavior checked on 2026-09-08
for Surgio's Surfboard formatter. The target is Surfboard mobile 2.34.4 or
newer. This version adds Gecko obfuscation and VMess encryption selection,
and fixes WireGuard connections to IPv6 endpoints.
See the [official changelog](https://getsurfboard.com/docs/changelog/).

## Protocol mapping

| Protocol | Surfboard output and relevant options |
| --- | --- |
| HTTP / HTTPS | `http` / `https`; positional server, port, username and password; TLS options on HTTPS |
| SOCKS5 / SOCKS5-TLS | `socks5` / `socks5-tls`; positional credentials; `udp-relay`; TLS options on the TLS variant |
| Shadowsocks | `ss`; `encrypt-method`, `password`, `udp-relay`, `obfs`, `obfs-host`, `obfs-uri` |
| VMess | `vmess`; UUID in `username`; TCP or WebSocket; `tls`, `ws`, `ws-path`, `ws-headers`, `vmess-aead`, `encrypt-method`, `udp-relay` |
| Trojan | `trojan`; `password`; TCP or WebSocket; TLS options and `udp-relay` |
| Snell | `snell`; `psk`, `version`, `obfs`, `obfs-host`, `obfs-uri`, `udp-relay` |
| AnyTLS | `anytls`; `password`, `reuse`, TLS options and `udp-relay` |
| Hysteria2 | `hysteria2`; `password`, `download-bandwidth`, `port-hopping`, `port-hopping-interval`, `salamander-password`, `gecko-password`, TLS options and `udp-relay` |
| TUIC v5 | `tuic-v5`; `uuid`, `password`, `alpn`, port hopping, TLS options and `udp-relay` |
| WireGuard | `wireguard, section-name=...` with a separate `[WireGuard ...]` section |

These are the protocols listed by the
[proxy manual](https://getsurfboard.com/docs/profile-format/proxy/).
VLESS, Hysteria v1 and TUIC v4 are outside the documented target. Surfboard
explicitly excludes TUIC's legacy token-based v4 format in its
[TUIC manual](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/tuic-v5/).

## Existing protocol corrections

HTTP and SOCKS credentials occupy arguments four and five. SOCKS output must
preserve those positions when credentials are absent. `client-cert` is absent
from the documented SOCKS options, so the formatter does not emit it.
See [HTTP / HTTPS](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/http/)
and [SOCKS5](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/socks5/).

VMess defaults to `vmess-aead=true`; an explicit false value still disables
AEAD. Its supported encryption methods are `aes-128-gcm` and
`chacha20-ietf-poly1305`, with AES as the default. WebSocket paths default to
`/`, and headers use `name:value` entries separated by `|`. VMess and Trojan
both default UDP relay to false. The formatter must retain an explicit
`udpRelay` value instead of dropping it. See
[VMess](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/vmess/)
and [Trojan](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/trojan/).

Shadowsocks supports simple-obfs HTTP/TLS, including `obfs-uri`. The manual
does not document v2ray-plugin WebSocket support. SS2022 uses the same output
syntax as other methods and supports the AES-128 and AES-256 variants. See
[Shadowsocks](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/shadowsocks/).
The 2.28.1 changelog also documents identity-form SS2022 passwords,
`password:identity`. Validating the whole password as one fixed-length base64
key would reject that form.

## New protocols and shared options

Snell supports versions 1 through 4, defaults to version 1, and interprets
version 5 as version 4. UDP defaults to false and works on versions 3 and 4.
Surgio emits version 4 for a v5 node and warns about this conversion,
matching the documented client behavior. See
[Snell](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/snell/).

AnyTLS defaults both session reuse and UDP relay to true. Its password can
use a named argument. See
[AnyTLS](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/anytls/).

Hysteria2 download bandwidth uses Mbps. Port hopping uses a quoted,
semicolon-separated value such as `"1234;5000-6000"`, and the interval uses
seconds. Gecko takes precedence when both obfuscation passwords are present.
UDP defaults to true. See
[Hysteria2](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/hysteria2/).

TUIC v5 defaults to ALPN `h3`, a hopping interval of 30 seconds, and UDP
relay enabled. The documentation only illustrates one ALPN value; it does
not establish a delimiter for several values. Multiple ALPN entries remain
unverified, rather than proven unsupported. Surgio does not select one entry
or invent a serialization for them. See
[TUIC v5](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/tuic-v5/).

External proxies support `underlying-proxy` and `block-quic=auto|on|off`.
The latter defaults to auto and follows the proxy's UDP capability. See
[common parameters](https://getsurfboard.com/docs/profile-format/proxy/).
TLS-capable proxies support `skip-cert-verify`, `sni`, and
`server-cert-fingerprint-sha256`. Certificate fingerprints are 64-character
hex values and can form a comma-separated list. See
[HTTPS TLS parameters](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/http/).

## WireGuard sections

The proxy line references a separate section containing `private-key`,
`self-ip`, optional `self-ip-v6`, DNS servers, MTU and a parenthesized `peer`
map. Peer settings include `public-key`, `allowed-ips`, `endpoint`, optional
`preshared-key` and optional `keepalive`. IPv6 endpoints require brackets.
Both manuals require explicit allowed IP routes; they provide no default.
See [WireGuard](https://getsurfboard.com/docs/profile-format/proxy/external-proxy/wireguard/).

Only one peer appears in the official syntax and examples. Multi-peer
serialization remains unverified. Surgio limits this formatter to a single
peer and reports multi-peer input instead of dropping peers. WireGuard
section output belongs outside `[Proxy]`, so templates need a separate
section-rendering helper.

## Documentation conflicts and serialization limits

The [parser-derived reference](https://getsurfboard.com/docs/ai-profile-guide/reference/)
describes the current parser. Surgio uses it to resolve these conflicts with
older topic pages:

- SOCKS authentication is positional, not `username=` / `password=`.
- Release Shadowsocks ciphers include AEAD, SS2022 AES and `none`; legacy
  stream ciphers only work in debug builds.
- WireGuard DNS is optional and MTU defaults to 1280. Hostname endpoints and
  peer preshared keys are supported.
- WireGuard accepts `block-quic`, but not `underlying-proxy`.
- Snell is absent from the TLS parameter list, despite a changelog claim
  about certificate pinning. Surgio does not emit Snell TLS parameters.

The reference documents single or double quote wrapping for values containing
commas, semicolons or spaces. It does not establish JSON-style backslash
escaping. Surgio chooses a usable quote delimiter and rejects values requiring
an undocumented escape form. This is a formatter limitation, not a claim
that the app rejects every such value.

## Version floors

The [changelog](https://getsurfboard.com/docs/changelog/) records these
introductions:

| Capability | Mobile version |
| --- | --- |
| WireGuard | 2.22.0 |
| WireGuard preshared key / keepalive | 2.23.2 / 2.25.2 |
| SS2022 AES and Hysteria2 | 2.26.0 |
| AnyTLS | 2.27.0 |
| Snell / SS2022 identity passwords | 2.28.0 / 2.28.1 |
| WireGuard IPv6 | 2.29.1 |
| Underlying proxy | 2.30.0 |
| Certificate pinning, block-quic, Snell v4 | 2.31.1 |
| Hysteria2 Salamander | 2.32.2 |
| AnyTLS UDP and UDP proxy chaining | 2.32.4 |
| TUIC v5 | 2.33.0 |
| Gecko, VMess encrypt-method, IPv6 WireGuard endpoint fix | 2.34.4 |

Surgio documents these versions without adding client-version negotiation.
The research checks configuration documentation, not an Android connection
test against a running Surfboard app.
