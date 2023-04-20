import test from 'ava';

import { NodeTypeEnum, VmessNodeConfig } from '../../types';
import * as filter from '../filter';

const nodeConfigDefaults = {
  hostname: 'example.com',
  port: 443,
  method: 'chacha20-ietf-poly1305',
  password: 'password',
};

test('validateFilter', (t) => {
  t.false(filter.validateFilter(undefined));
  t.false(filter.validateFilter(null));
  t.true(
    filter.validateFilter(() => {
      return true;
    }),
  );
  t.true(filter.validateFilter(filter.useSortedKeywords(['US'])));
});

test('useKeywords', (t) => {
  const fn1 = filter.useKeywords(['测试', 'test']);
  const fn2 = filter.useKeywords(['测试', 'test'], true);

  t.true(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('discardKeywords', (t) => {
  const fn1 = filter.discardKeywords(['测试', 'test']);
  const fn2 = filter.discardKeywords(['测试', 'test'], true);

  t.false(
    fn1({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn1({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn2({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn2({
      nodeName: '美国测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    fn2({
      nodeName: '测试 test',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('useRegexp', (t) => {
  const fn = filter.useRegexp(/(测试|test)/i);

  t.true(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('useGlob', (t) => {
  let fn = filter.useGlob('测试*');

  t.true(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );

  fn = filter.useGlob('(汉堡|薯条)');

  t.true(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn({
      nodeName: '三个薯条',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('discardGlob', (t) => {
  let fn = filter.discardGlob('测试*');

  t.false(
    fn({
      nodeName: '测试',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    fn({
      nodeName: '测试节点',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn({
      nodeName: '美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );

  fn = filter.discardGlob('(汉堡|薯条)');

  t.false(
    fn({
      nodeName: '两个汉堡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    fn({
      nodeName: '无限堡薯',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('netflixFilter', (t) => {
  t.true(
    filter.netflixFilter({
      nodeName: 'hkbn 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.netflixFilter({
      nodeName: 'HKBN 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.netflixFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.netflixFilter({
      nodeName: 'HK NF',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.netflixFilter({
      nodeName: 'HK Netflix',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('youtubePremiumFilter', (t) => {
  t.true(
    filter.youtubePremiumFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.youtubePremiumFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.youtubePremiumFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('usFilter', (t) => {
  t.true(
    filter.usFilter({
      nodeName: '🇺🇸 美国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.usFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('hkFilter', (t) => {
  t.true(
    filter.hkFilter({
      nodeName: '🇭🇰',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.hkFilter({
      nodeName: 'HK',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.hkFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('japanFilter', (t) => {
  t.true(
    filter.japanFilter({
      nodeName: '🇯🇵',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.japanFilter({
      nodeName: 'JP',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.japanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('koreaFilter', (t) => {
  t.true(
    filter.koreaFilter({
      nodeName: '🇰🇷',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.koreaFilter({
      nodeName: '韩国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.koreaFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('singaporeFilter', (t) => {
  t.true(
    filter.singaporeFilter({
      nodeName: '🇸🇬',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.singaporeFilter({
      nodeName: '新加坡',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.singaporeFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});
333333333;
test('taiwanFilter', (t) => {
  t.true(
    filter.taiwanFilter({
      nodeName: '🇹🇼',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.taiwanFilter({
      nodeName: '台湾',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.taiwanFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('chinaBackFilter', (t) => {
  t.true(
    filter.chinaBackFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.chinaBackFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.chinaBackFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('chinaOutFilter', (t) => {
  t.false(
    filter.chinaOutFilter({
      nodeName: '回国',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.false(
    filter.chinaOutFilter({
      nodeName: '中国上海',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
  t.true(
    filter.chinaOutFilter({
      nodeName: 'US 1',
      type: NodeTypeEnum.Shadowsocks,
      ...nodeConfigDefaults,
    }),
  );
});

test('useSortedKeywords', (t) => {
  const fn = filter.useSortedKeywords(['test', '测试']);
  const result = fn.filter([
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('🇺🇸US 1'),
  ]);

  t.true(fn.supportSort);
  t.deepEqual(result, [
    generateVmessNode('test 测试 1'),
    generateVmessNode('test 2'),
    generateVmessNode('测试 1'),
    generateVmessNode('测试 2'),
    generateVmessNode('测试 3'),
  ]);
});

test('mergeSortedFilters 1', (t) => {
  const fn = filter.mergeSortedFilters([filter.hkFilter, filter.usFilter]);
  const result = fn.filter([
    generateVmessNode('US 1'),
    generateVmessNode('US 2'),
    generateVmessNode('HK 1'),
    generateVmessNode('HK 2'),
    generateVmessNode('test 1'),
  ]);

  t.true(fn.supportSort);
  t.deepEqual(result, [
    generateVmessNode('HK 1'),
    generateVmessNode('HK 2'),
    generateVmessNode('US 1'),
    generateVmessNode('US 2'),
  ]);
});

test('mergeSortedFilters 2', (t) => {
  t.throws(() => {
    const fn = filter.useSortedKeywords(['1']);
    filter.mergeSortedFilters([fn as any]);
  });

  t.throws(() => {
    // @ts-ignore
    filter.mergeSortedFilters([undefined]);
  });
});

test('mergeFilters', (t) => {
  t.throws(() => {
    const fn = filter.useSortedKeywords(['1']);
    filter.mergeFilters([fn as any]);
  });

  t.throws(() => {
    // @ts-ignore
    filter.mergeFilters([undefined]);
  });
});

test('complicated mergeFilters', (t) => {
  const fn = filter.mergeFilters([
    filter.mergeFilters(
      [filter.useKeywords(['test']), filter.useProviders(['foo'], true)],
      true,
    ),
    filter.mergeFilters(
      [filter.useKeywords(['test']), filter.useProviders(['bar'], true)],
      true,
    ),
  ]);

  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    true,
  );
  t.is(
    fn({
      provider: { name: 'foo2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    false,
  );
  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be false',
      ...nodeConfigDefaults,
    }),
    false,
  );
  t.is(
    fn({
      provider: { name: 'foo' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'should be true test',
      ...nodeConfigDefaults,
    }),
    true,
  );
  t.is(
    fn({
      provider: { name: 'bar' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    true,
  );
  t.is(
    fn({
      provider: { name: 'bar2' } as any,
      type: NodeTypeEnum.Shadowsocks,
      nodeName: 'test',
      ...nodeConfigDefaults,
    }),
    false,
  );
});

test('useProviders', (t) => {
  const fn = filter.useProviders(['测试', 'test'], false);
  const fn2 = filter.useProviders(['测试', 'test']);

  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    true,
  );
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    true,
  );
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    false,
  );

  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    false,
  );
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    false,
  );
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
    true,
  );
});

test('discardProviders', (t) => {
  const fn = filter.discardProviders(['测试', 'test'], false);
  const fn2 = filter.discardProviders(['测试', 'test']);

  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: '测试 asdf' },
    } as any),
    false,
  );
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    false,
  );
  t.is(
    fn({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    true,
  );

  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test' },
    } as any),
    false,
  );
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'test asdf' },
    } as any),
    true,
  );
  t.is(
    fn2({
      ...generateVmessNode('test'),
      provider: { name: 'other' },
    } as any),
    true,
  );
});

function generateVmessNode(nodeName: string): VmessNodeConfig {
  return {
    type: NodeTypeEnum.Vmess,
    alterId: '64',
    hostname: '1.1.1.1',
    method: 'auto',
    network: 'tcp',
    nodeName,
    path: '/',
    port: 8080,
    tls: false,
    host: '',
    uuid: '1386f85e-657b-4d6e-9d56-78badb75e1fd',
  };
}
