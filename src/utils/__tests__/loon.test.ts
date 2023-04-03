import test from 'ava';

import { NodeTypeEnum } from '../../types';
import { ERR_INVALID_FILTER } from '../../constant';
import { getLoonNodes } from '../loon';

test('getLoonNodes', (t) => {
  t.is(
    getLoonNodes([
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
        udpRelay: true,
        uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
      },
    ]),
    '测试 = vmess,1.1.1.1,443,method=chacha20-ietf-poly1305,"1386f85e-657b-4d6e-9d56-78badb75e1fd",transport=tcp,over-tls=true,tls-name=1.1.1.1,skip-cert-verify=false',
  );
  t.is(
    getLoonNodes([
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
    ]),
    '🇭🇰HK = ShadowsocksR,hk.example.com,10000,chacha20-ietf,"password",protocol=auth_aes128_md5,protocol-param=,obfs=tls1.2_ticket_auth,obfs-param=music.163.com',
  );
  t.is(
    getLoonNodes([
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
    'test = https,a.com,443,snsms,"nndndnd",tls-name=a.com,skip-cert-verify=false',
  );
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
      },
    ]),
    'trojan = trojan,example.com,443,"password1",tls-name=example.com,skip-cert-verify=false',
  );
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
      },
    ]),
    'trojan = trojan,example.com,443,"password1",tls-name=example.com,skip-cert-verify=true',
  );
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
      },
    ]),
    'trojan = trojan,example.com,443,"password1",tls-name=sni.example.com,skip-cert-verify=true',
  );
  t.is(
    getLoonNodes([
      {
        type: NodeTypeEnum.Trojan,
        nodeName: 'trojan',
        hostname: 'example.com',
        port: 443,
        password: 'password1',
        sni: 'sni.example.com',
        udpRelay: true,
        skipCertVerify: true,
        tfo: true,
        tls13: true,
        network: 'ws',
        wsPath: '/ws',
        wsHeaders: {
          host: 'example.com',
        },
      },
    ]),
    'trojan = trojan,example.com,443,"password1",tls-name=sni.example.com,skip-cert-verify=true,transport=ws,path=/ws,host=example.com',
  );
});

test('getLoonNodes error', (t) => {
  t.throws(
    () => {
      getLoonNodes(
        [
          {
            type: NodeTypeEnum.Trojan,
            nodeName: 'trojan',
            hostname: 'example.com',
            port: 443,
            password: 'password1',
            sni: 'sni.example.com',
            udpRelay: true,
            skipCertVerify: true,
            tfo: true,
            tls13: true,
          },
        ],
        undefined,
      );
    },
    undefined,
    ERR_INVALID_FILTER,
  );
});
