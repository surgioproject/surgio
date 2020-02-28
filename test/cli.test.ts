// tslint:disable:no-expression-statement
import test from 'ava';
import coffee from 'coffee';
import path from 'path';
import fs from 'fs-extra';
import ini from 'ini';

const cli = path.join(__dirname, '../bin/surgio.js');
const fixture = path.join(__dirname, './fixture');
const resolve = p => path.join(fixture, p);

test('cli works', async t => {
  await coffee.fork(cli, ['generate', '-h'], {
    cwd: resolve('plain'),
  })
    .expect('code', 0)
    .end();

  await coffee.fork(cli, ['generate'], {
    cwd: resolve('plain'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .debug()
    .expect('code', 0)
    .end();

  const confString1 = fs.readFileSync(resolve('plain/dist/ss_json.conf'), {
    encoding: 'utf8',
  });
  const confString2 = fs.readFileSync(resolve('plain/dist/custom.conf'), {
    encoding: 'utf8',
  });
  const confString3 = fs.readFileSync(resolve('plain/dist/template-functions.conf'), {
    encoding: 'utf8',
  });
  const conf = ini.decode(confString1);

  t.truthy(fs.existsSync(resolve('plain/dist/new_path.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ss.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ssr.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/v2rayn.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/custom.conf')));
  t.is(confString1.split('\n')[0], '#!MANAGED-CONFIG https://example.com/ss_json.conf?access_token=abcd interval=43200 strict=false');
  t.true(confString2.includes('select, 🇺🇲 US'));
  t.is(Object.keys(conf.Proxy).length, 4);
  t.snapshot(confString3);
});

test('template error', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('template-error'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();

  t.is(code, 1);
});

test('not specify binPath', async t => {
  const { stderr, code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('not-specify-binPath'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();

  t.is(code, 1);
  t.truthy(stderr.includes('You must specify a binary file path for Shadowsocksr'));
});

test('template variables and functions', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('template-variables-functions'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();
  const confString = fs.readFileSync(resolve('template-variables-functions/dist/ss.conf'), {
    encoding: 'utf8',
  });
  const result = '# Netflix\n' +
    'USER-AGENT,Argo*,Proxy\n' +
    'DOMAIN-SUFFIX,fast.com,Proxy\n' +
    'DOMAIN-SUFFIX,netflix.com,Proxy\n' +
    'DOMAIN-SUFFIX,netflix.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxext.com,Proxy\n' +
    'DOMAIN-SUFFIX,nflximg.com,Proxy\n' +
    'DOMAIN-SUFFIX,nflximg.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxso.net,Proxy\n' +
    'DOMAIN-SUFFIX,nflxvideo.net,Proxy\n' +
    'http://example.com/ss.conf\n';

  t.is(code, 0);
  t.is(confString, result);
});

test('assign local port', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('assign-local-port'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();
  const confString1 = fs.readFileSync(resolve('assign-local-port/dist/ssr.conf'), {
    encoding: 'utf8',
  });
  const confString2 = fs.readFileSync(resolve('assign-local-port/dist/v2rayn.conf'), {
    encoding: 'utf8',
  });
  const conf1 = ini.decode(confString1);
  const conf2 = ini.decode(confString2);

  t.is(code, 0);
  t.truthy(conf1.Proxy.测试中文.includes('local-port = 5000'));
  t.truthy(conf2.Proxy['测试 1'].includes('local-port = 4000'));
  t.truthy(conf2.Proxy['测试 2'].includes('local-port = 4001'));
});

test('custom filter', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('custom-filter'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .debug()
    .end();
  const confString1 = fs.readFileSync(resolve('custom-filter/dist/ss.conf'), {
    encoding: 'utf8',
  });
  const confString2 = fs.readFileSync(resolve('custom-filter/dist/test_sorted_filter.conf'), {
    encoding: 'utf8',
  });

  t.snapshot(confString1);
  t.snapshot(confString2);
});
