import test from 'ava';

import { NodeTypeEnum } from '../../types';
import * as quantumult from '../quantumult';

test('getQuantumultNodes', (t) => {
  const schemeList = quantumult
    .getQuantumultNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        path: '/',
        port: 8080,
        tls: false,
        host: 'example.com',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 3',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: '🇭🇰HK',
        hostname: 'hk.example.com',
        port: 10000,
        method: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        obfsparam: 'music.163.com',
        protocol: 'auth_aes128_md5',
        protoparam: '',
      },
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        username: 'snsms',
        password: 'nndndnd',
      },
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[1],
    'vmess://5rWL6K+VIDIgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXRjcCxvYmZzLXBhdGg9Ii8iLG9iZnMtaGVhZGVyPSJob3N0OjEuMS4xLjFbUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
  t.is(
    schemeList[2],
    'vmess://5rWL6K+VIDMgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6MS4xLjEuMVtScl1bTm5ddXNlci1hZ2VudDpNb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDEzXzUgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBWZXJzaW9uLzEzLjEuMSBNb2JpbGUvMTVFMTQ4IFNhZmFyaS82MDQuMSI=',
  );
  t.is(
    schemeList[3],
    'ssr://aGsuZXhhbXBsZS5jb206MTAwMDA6YXV0aF9hZXMxMjhfbWQ1OmNoYWNoYTIwLWlldGY6dGxzMS4yX3RpY2tldF9hdXRoOmNHRnpjM2R2Y21RLz9ncm91cD1VM1Z5WjJsdiZvYmZzcGFyYW09YlhWemFXTXVNVFl6TG1OdmJRJnByb3RvcGFyYW09JnJlbWFya3M9OEotSHJmQ2ZoN0JJU3cmdWRwcG9ydD0wJnVvdD0w',
  );
  t.is(
    schemeList[4],
    'http://dGVzdCA9IGh0dHAsIHVwc3RyZWFtLXByb3h5LWFkZHJlc3M9YS5jb20sIHVwc3RyZWFtLXByb3h5LXBvcnQ9NDQzLCB1cHN0cmVhbS1wcm94eS1hdXRoPXRydWUsIHVwc3RyZWFtLXByb3h5LXVzZXJuYW1lPXNuc21zLCB1cHN0cmVhbS1wcm94eS1wYXNzd29yZD1ubmRuZG5kLCBvdmVyLXRscz10cnVlLCBjZXJ0aWZpY2F0ZT0x',
  );
  t.is(
    schemeList[5],
    'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZA@us.example.com:443/?plugin=obfs-local%3Bobfs%3Dtls%3Bobfs-host%3Dgateway-carry.icloud.com&group=Surgio#%F0%9F%87%BA%F0%9F%87%B8US%201',
  );
});

test('getQuantumultNodes with filter', (t) => {
  const schemeList = quantumult
    .getQuantumultNodes(
      [
        {
          type: NodeTypeEnum.Vmess,
          alterId: '64',
          hostname: '1.1.1.1',
          method: 'auto',
          network: 'ws',
          nodeName: '测试 1',
          path: '/',
          port: 8080,
          tls: false,
          host: 'example.com',
          uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        },
        {
          type: NodeTypeEnum.Vmess,
          alterId: '64',
          hostname: '1.1.1.1',
          method: 'auto',
          network: 'tcp',
          nodeName: '测试 2',
          path: '/',
          port: 8080,
          tls: false,
          host: '',
          uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        },
      ],
      undefined,
      (item) => item.nodeName === '测试 1',
    )
    .split('\n');

  t.is(
    schemeList[0],
    'vmess://5rWL6K+VIDEgPSB2bWVzcywxLjEuMS4xLDgwODAsY2hhY2hhMjAtaWV0Zi1wb2x5MTMwNSwiMTM4NmY4NWUtNjU3Yi00ZDZlLTlkNTYtNzhiYWRiNzVlMWZkIiw2NCxncm91cD1TdXJnaW8sb3Zlci10bHM9ZmFsc2UsY2VydGlmaWNhdGU9MSxvYmZzPXdzLG9iZnMtcGF0aD0iLyIsb2Jmcy1oZWFkZXI9Imhvc3Q6ZXhhbXBsZS5jb21bUnJdW05uXXVzZXItYWdlbnQ6TW96aWxsYS81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxM181IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0LzYwNS4xLjE1IChLSFRNTCwgbGlrZSBHZWNrbykgVmVyc2lvbi8xMy4xLjEgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjEi',
  );
});

test('getQuantumultXNodes', (t) => {
  const schemeList = quantumult
    .getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 1',
        path: '/',
        port: 8080,
        tls: false,
        host: 'example.com',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 2',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'ws',
        nodeName: '测试 3',
        path: '/',
        port: 8080,
        tls: false,
        host: '',
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: '🇭🇰HK',
        hostname: 'hk.example.com',
        port: 10000,
        method: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        obfsparam: 'music.163.com',
        protocol: 'auth_aes128_md5',
        protoparam: '',
      },
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        username: 'snsms',
        password: 'nndndnd',
      },
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
        tfo: true,
      },
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试 4',
        port: 443,
        tls: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ])
    .split('\n');

  t.is(
    schemeList[0],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=ws, obfs-uri=/, obfs-host=example.com, tag=测试 1',
  );
  t.is(
    schemeList[1],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, tag=测试 2',
  );
  t.is(
    schemeList[2],
    'vmess=1.1.1.1:8080, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=ws, obfs-uri=/, obfs-host=1.1.1.1, tag=测试 3',
  );
  t.is(
    schemeList[3],
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, tag=🇭🇰HK',
  );
  t.is(
    schemeList[4],
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tag=test',
  );
  t.is(
    schemeList[5],
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, fast-open=true, tag=🇺🇸US 1',
  );
  t.is(
    schemeList[6],
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, aead=false, obfs=over-tls, tls-verification=true, tag=测试 4',
  );

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=false, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  );

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls-verification=true, tls13=true, tag=测试',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        tls13: true,
        username: 'snsms',
        password: 'nndndnd',
      },
    ]),
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tls13=true, tag=test',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=true, over-tls=true, tag=trojan',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, over-tls=true, tag=trojan',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, over-tls=true, tls-host=sni.example.com, tag=trojan',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'example.com',
          'multi words key': 'multi words value',
        },
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, obfs=wss, obfs-uri=/ws, obfs-host=sni.example.com, tag=trojan',
  );

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        'udp-relay': true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'example.com',
          'multi words key': 'multi words value',
        },
        testUrl: 'http://example.com',
      },
    ]),
    'trojan=example.com:443, password=password1, tls-verification=false, fast-open=true, udp-relay=true, tls13=true, obfs=wss, obfs-uri=/ws, obfs-host=sni.example.com, server_check_url=http://example.com, tag=trojan',
  );

  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Vmess,
        alterId: '64',
        hostname: '1.1.1.1',
        method: 'auto',
        network: 'tcp',
        nodeName: '测试',
        port: 443,
        tls: true,
        tls13: true,
        'udp-relay': true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
        quantumultXConfig: {
          vmessAEAD: true,
        },
        testUrl: 'http://example.com',
      },
    ]),
    'vmess=1.1.1.1:443, method=chacha20-ietf-poly1305, password=1386f85e-657b-4d6e-9d56-78badb75e1fd, udp-relay=true, aead=true, obfs=over-tls, tls-verification=true, tls13=true, server_check_url=http://example.com, tag=测试',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.HTTPS,
        nodeName: 'test',
        hostname: 'a.com',
        port: 443,
        tls13: true,
        username: 'snsms',
        password: 'nndndnd',
        testUrl: 'http://example.com',
      },
    ]),
    'http=a.com:443, username=snsms, password=nndndnd, over-tls=true, tls-verification=true, tls13=true, server_check_url=http://example.com, tag=test',
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        nodeName: '🇺🇸US 1',
        type: NodeTypeEnum.Shadowsocks,
        hostname: 'us.example.com',
        port: 443,
        method: 'chacha20-ietf-poly1305',
        password: 'password',
        'udp-relay': true,
        obfs: 'tls',
        'obfs-host': 'gateway-carry.icloud.com',
        testUrl: 'http://example.com',
      },
    ]),
    'shadowsocks=us.example.com:443, method=chacha20-ietf-poly1305, password=password, obfs=tls, obfs-host=gateway-carry.icloud.com, udp-relay=true, server_check_url=http://example.com, tag=🇺🇸US 1'
  );
  t.is(
    quantumult.getQuantumultXNodes([
      {
        type: NodeTypeEnum.Shadowsocksr,
        nodeName: '🇭🇰HK',
        hostname: 'hk.example.com',
        port: 10000,
        method: 'chacha20-ietf',
        password: 'password',
        obfs: 'tls1.2_ticket_auth',
        obfsparam: 'music.163.com',
        protocol: 'auth_aes128_md5',
        protoparam: '',
        testUrl: 'http://example.com',
      },
    ]),
    'shadowsocks=hk.example.com:10000, method=chacha20-ietf, password=password, ssr-protocol=auth_aes128_md5, ssr-protocol-param=, obfs=tls1.2_ticket_auth, obfs-host=music.163.com, server_check_url=http://example.com, tag=🇭🇰HK'
  );
});
