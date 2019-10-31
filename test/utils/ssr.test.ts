import test from 'ava';
import { NodeTypeEnum } from '../../lib/types';
import { parseSSRUri } from '../../lib/utils/ssr';

test('parseSSRUri 1 - standard base64', t => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/?obfsparam=&protoparam=MTIzNDU2ICAgICA6MTIzNDVxd2VydHl1&remarks=8J+Hr/Cfh7UgSlA=&group=U3VyZ2lv
  const uri = 'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0vP29iZnNwYXJhbT0mcHJvdG9wYXJhbT1NVEl6TkRVMklDQWdJQ0E2TVRJek5EVnhkMlZ5ZEhsMSZyZW1hcmtzPThKK0hyL0NmaDdVZ1NsQT0mZ3JvdXA9VTNWeVoybHY=';
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
    obfsparam: ''
  });
});

test('parseSSRUri 2 - standard base64', t => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==
  const uri = 'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0=';
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
    obfsparam: ''
  });
});

test('parseSSRUri 3 - standard base64', t => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/
  const uri = 'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0v';
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
    obfsparam: ''
  });
});

test('parseSSRUri 4 - standard base64', t => {
  // example.com:80:auth_aes128_sha1:chacha20:plain:ZXhhbXBsZQ==/?
  const uri = 'ssr://ZXhhbXBsZS5jb206ODA6YXV0aF9hZXMxMjhfc2hhMTpjaGFjaGEyMDpwbGFpbjpaWGhoYlhCc1pRPT0vPw==';
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
    obfsparam: ''
  });
});
