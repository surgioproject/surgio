import test from 'ava';
import * as utils from '../../lib/utils/remote-snippet';

test.serial('loadRemoteSnippetList', async t => {
  const snippets = [
    {
      url: 'http://example.com/telegram.list',
      name: 'telegram',
    },
    {
      url: 'http://example.com/netflix.list',
      name: 'netflix',
    },
    {
      url: 'http://example.com/test-ruleset.list',
      name: 'test',
    },
    {
      url: 'http://example.com/ForeignMedia.list',
      name: 'ForeignMedia',
    },
  ];
  const remoteSnippetList = await utils.loadRemoteSnippetList(snippets);

  // with cache
  await utils.loadRemoteSnippetList(snippets);

  t.snapshot(remoteSnippetList[0].main('Proxy'));
  t.snapshot(remoteSnippetList[1].main('Proxy'));
  t.snapshot(remoteSnippetList[2].main('Proxy'));
  t.snapshot(remoteSnippetList[3].main('Proxy'));
});

test.serial('loadRemoteSnippetList in now', async t => {
  process.env.NOW_REGION = 'dev_1';

  const remoteSnippetList = await utils.loadRemoteSnippetList([
    {
      url: 'http://example.com/telegram.list?v=1',
      name: 'telegram',
    },
    {
      url: 'http://example.com/netflix.list?v=1',
      name: 'netflix',
    },
    {
      url: 'http://example.com/test-ruleset.list?v=1',
      name: 'test',
    },
    {
      url: 'http://example.com/ForeignMedia.list?v=1',
      name: 'ForeignMedia',
    },
  ]);

  t.snapshot(remoteSnippetList[0].main('Proxy'));
  t.snapshot(remoteSnippetList[1].main('Proxy'));
  t.snapshot(remoteSnippetList[2].main('Proxy'));
  t.snapshot(remoteSnippetList[3].main('Proxy'));

  process.env.NOW_REGION = undefined;
});

test('loadRemoteSnippetList with error', async t => {
  t.plan(1);
  try {
    const res = await utils.loadRemoteSnippetList([
      {
        url: 'http://example.com/error',
        name: 'error',
      },
    ]);
  } catch (err) {
    t.truthy(err instanceof Error);
  }
});

test('addProxyToSurgeRuleSet', t => {
  t.is(
    utils.addProxyToSurgeRuleSet('AND,((SRC-IP,192.168.1.110), (DOMAIN, example.com))', 'Proxy'),
    'AND,((SRC-IP,192.168.1.110), (DOMAIN, example.com)),Proxy'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('IP-CIDR,192.168.0.0/16,no-resolve', 'Proxy'),
    'IP-CIDR,192.168.0.0/16,Proxy,no-resolve'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,no-resolve', 'Proxy'),
    'IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,Proxy,no-resolve'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('IP-CIDR,192.168.0.0/16', 'Proxy'),
    'IP-CIDR,192.168.0.0/16,Proxy'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128', 'Proxy'),
    'IP-CIDR6,2a03:2880:f200:c3:face:b00c::177/128,Proxy'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('GEOIP,US,no-resolve', 'Proxy'),
    'GEOIP,US,Proxy,no-resolve'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('URL-REGEX,^http://google\.com', 'Proxy'),
    'URL-REGEX,^http://google\.com,Proxy'
  );
  t.is(
    utils.addProxyToSurgeRuleSet('DOMAIN,www.apple.com # comment comment', 'Proxy'),
    'DOMAIN,www.apple.com,Proxy'
  );
});
