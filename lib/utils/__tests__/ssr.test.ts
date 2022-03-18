import test from 'ava';
import { NodeTypeEnum } from '../../types';
import { parseSSRUri } from '../ssr';

test('parseSSRUri 1 - standard base64', (t) => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/?obfsparam=&protoparam=MTIzNDU2ICAgICA6MTIzNDVxd2VydHl1&remarks=8J+Hr/Cfh7UgSlA=&group=U3VyZ2lv
  const uri =
    'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0vP29iZnNwYXJhbT0mcHJvdG9wYXJhbT1NVEl6TkRVMklDQWdJQ0E2TVRJek5EVnhkMlZ5ZEhsMSZyZW1hcmtzPThKK0hyL0NmaDdVZ1NsQT0mZ3JvdXA9VTNWeVoybHY=';
  const conf = parseSSRUri(uri);

  t.deepEqual(conf, {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: '🇯🇵 JP',
    hostname: 'example.com',
    port: '80',
    protocol: 'auth_aes128_sha1',
    method: 'chacha20',
    obfs: 'plain',
    password: 'example',
    protoparam: '123456:12345qwertyu',
    obfsparam: '',
  });
});

test('parseSSRUri 2 - standard base64', (t) => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==
  const uri =
    'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0=';
  const conf = parseSSRUri(uri);

  t.deepEqual(conf, {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: 'example.com:80',
    hostname: 'example.com',
    port: '80',
    protocol: 'auth_aes128_sha1',
    method: 'chacha20',
    obfs: 'plain',
    password: 'example',
    protoparam: '',
    obfsparam: '',
  });
});

test('parseSSRUri 3 - standard base64', (t) => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/
  const uri =
    'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0v';
  const conf = parseSSRUri(uri);

  t.deepEqual(conf, {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: 'example.com:80',
    hostname: 'example.com',
    port: '80',
    protocol: 'auth_aes128_sha1',
    method: 'chacha20',
    obfs: 'plain',
    password: 'example',
    protoparam: '',
    obfsparam: '',
  });
});

test('parseSSRUri 4 - standard base64', (t) => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/?
  const uri =
    'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0vPw==';
  const conf = parseSSRUri(uri);

  t.deepEqual(conf, {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: 'example.com:80',
    hostname: 'example.com',
    port: '80',
    protocol: 'auth_aes128_sha1',
    method: 'chacha20',
    obfs: 'plain',
    password: 'example',
    protoparam: '',
    obfsparam: '',
  });
});

test('parseSSRUri ipv6', (t) => {
  // 2404:6800:4005:801::2003:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/?obfsparam=&protoparam=MTIzNDU2ICAgICA6MTIzNDVxd2VydHl1&remarks=8J+Hr/Cfh7UgSlA=&group=U3VyZ2lv
  const uri =
    'ssr://MjQwNDo2ODAwOjQwMDU6ODAxOjoyMDAzOjgwOmF1dGhfYWVzMTI4X3NoYTE6Y2hhY2hhMjA6cGxhaW46WlhoaGJYQnNaUT09Lz9vYmZzcGFyYW09JnByb3RvcGFyYW09TVRJek5EVTJJQ0FnSUNBNk1USXpORFZ4ZDJWeWRIbDEmcmVtYXJrcz04SitIci9DZmg3VWdTbEE9Jmdyb3VwPVUzVnlaMmx2';
  const conf = parseSSRUri(uri);

  t.deepEqual(conf, {
    type: NodeTypeEnum.Shadowsocksr,
    nodeName: '🇯🇵 JP',
    hostname: '2404:6800:4005:801::2003',
    port: '80',
    protocol: 'auth_aes128_sha1',
    method: 'chacha20',
    obfs: 'plain',
    password: 'example',
    protoparam: '123456:12345qwertyu',
    obfsparam: '',
  });
});
