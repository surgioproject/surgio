import test from 'ava';
import { ValidationError } from 'joi';
import sinon from 'sinon';

import { NodeTypeEnum, SupportProviderEnum } from '../../types';
import * as config from '../../utils/config';
import CustomProvider from '../CustomProvider';

const sandbox = sinon.createSandbox();

test.beforeEach(() => {
  sandbox.restore();
  sandbox.stub(config, 'getConfig').returns({} as any);
});

test('CustomProvider should work', async (t) => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [],
  });

  t.deepEqual(await provider.getNodeList(), []);
});

test('CustomProvider should throw error if udp-relay is a string', async (t) => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: 'test',
        'udp-relay': 'true',
      },
    ],
  });

  return t.throwsAsync(
    async () => {
      await provider.getNodeList();
    },
    {
      instanceOf: ValidationError,
      message: '"udp-relay" must be a boolean',
    },
  );
});

test('CustomProvider should format header keys to lowercase', async (t) => {
  const provider = new CustomProvider('test', {
    type: SupportProviderEnum.Custom,
    nodeList: [
      {
        type: NodeTypeEnum.Shadowsocks,
        nodeName: 'test',
        wsHeaders: {
          Host: 'Example.com',
        },
      },
    ],
  });

  t.deepEqual(await provider.getNodeList(), [
    {
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      wsHeaders: {
        host: 'Example.com',
      },
    },
  ]);
});

test('CustomProvider underlying proxy', async (t) => {
  t.deepEqual(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          'udp-relay': true,
        },
      ],
    }).getNodeList(),
    [
      {
        nodeName: 'test',
        type: 'shadowsocks',
        'udp-relay': true,
        underlyingProxy: 'underlying-proxy',
      },
    ],
  );

  t.deepEqual(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy-1',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          'udp-relay': true,
          underlyingProxy: 'underlying-proxy-2',
        },
      ],
    }).getNodeList(),
    [
      {
        nodeName: 'test',
        type: 'shadowsocks',
        'udp-relay': true,
        underlyingProxy: 'underlying-proxy-2',
      },
    ],
  );

  t.deepEqual(
    await new CustomProvider('test', {
      type: SupportProviderEnum.Custom,
      underlyingProxy: 'underlying-proxy-2',
      nodeList: [
        {
          type: NodeTypeEnum.Shadowsocks,
          nodeName: 'test',
          'udp-relay': true,
          underlyingProxy: 'underlying-proxy-2',
        },
      ],
    }).getNodeList(),
    [
      {
        nodeName: 'test',
        type: 'shadowsocks',
        'udp-relay': true,
        underlyingProxy: 'underlying-proxy-2',
      },
    ],
  );
});
