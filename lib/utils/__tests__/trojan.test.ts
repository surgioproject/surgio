import test from 'ava';
import { NodeTypeEnum } from '../../types';

import { parseTrojanUri } from '../trojan';

test('parseTrojanUri', (t) => {
  t.deepEqual(
    parseTrojanUri(
      'trojan://password@example.com:443?allowInsecure=1&peer=sni.example.com#Example%20%E8%8A%82%E7%82%B9',
    ),
    {
      hostname: 'example.com',
      nodeName: 'Example 节点',
      password: 'password',
      port: '443',
      skipCertVerify: true,
      sni: 'sni.example.com',
      type: NodeTypeEnum.Trojan,
    },
  );

  t.deepEqual(
    parseTrojanUri(
      'trojan://password@example.com:443#Example%20%E8%8A%82%E7%82%B9',
    ),
    {
      hostname: 'example.com',
      nodeName: 'Example 节点',
      password: 'password',
      port: '443',
      type: NodeTypeEnum.Trojan,
    },
  );

  t.deepEqual(
    parseTrojanUri(
      'trojan://password@example.com:443?allowInsecure=true&peer=sni.example.com',
    ),
    {
      hostname: 'example.com',
      nodeName: 'example.com:443',
      password: 'password',
      port: '443',
      skipCertVerify: true,
      sni: 'sni.example.com',
      type: NodeTypeEnum.Trojan,
    },
  );

  t.throws(
    () => {
      parseTrojanUri('ss://');
    },
    undefined,
    'Invalid Trojan URI.',
  );
});
