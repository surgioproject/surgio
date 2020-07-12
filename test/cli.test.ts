import test from 'ava';
import coffee from 'coffee';
import { join } from 'path';
import fs from 'fs-extra';
import ini from 'ini';

const cli = join(__dirname, '../bin/surgio.js');
const fixture = join(__dirname, './fixture');
const resolve = p => join(fixture, p);

test.serial('doctor command', async t => {
  await t.notThrowsAsync(async () => {
    await coffee.fork(cli, ['doctor'], {
      cwd: resolve('plain'),
    })
      .expect('code', 0)
      .end();
  });
});

test.serial('cli works', async t => {
  await coffee.fork(cli, ['generate', '-h'], {
    cwd: resolve('plain'),
  })
    .expect('code', 0)
    .end();

  await coffee.fork(cli, ['generate'], {
    cwd: resolve('plain'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
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
  const confString5 = fs.readFileSync(resolve('plain/dist/v2rayn.conf'), {
    encoding: 'utf8',
  });
  const conf = ini.decode(confString1);

  t.truthy(fs.existsSync(resolve('plain/dist/new_path.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ss.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ssr.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/v2rayn.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/custom.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ssd.conf')));
  t.is(confString1.split('\n')[0], '#!MANAGED-CONFIG https://example.com/ss_json.conf?access_token=abcd interval=43200 strict=false');
  t.true(confString2.includes('select, 🇺🇲 US'));
  t.is(Object.keys(conf.Proxy).length, 4);
  t.snapshot(confString3);
  t.snapshot(confString5);
});

test.serial('--skip-fail should work', async t => {
  await t.notThrowsAsync(async () => {
    await coffee.fork(cli, ['generate', '--skip-fail'], {
      cwd: resolve('plain'),
      execArgv: ['--require', require.resolve('./stub-axios.js')],
    })
      .debug()
      .expect('code', 0)
      .end();
  });
});

test.serial('template error', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('template-error'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();

  t.is(code, 1);
});

test.serial('not specify binPath', async t => {
  const { stderr, code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('not-specify-binPath'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();

  t.is(code, 1);
  t.truthy(stderr.includes('请按照文档 https://bit.ly/2WnHB3p 添加 Shadowsocksr 二进制文件路径'));
});

test.serial('template variables and functions', async t => {
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

test.serial('assign local port', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('assign-local-port'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .end();
  const confString1 = fs.readFileSync(resolve('assign-local-port/dist/ssr.conf'), {
    encoding: 'utf8',
  });
  const conf1 = ini.decode(confString1);

  t.is(code, 0);
  t.truthy(conf1.Proxy.测试中文.includes('local-port = 5000'));
});

test.serial('custom filter', async t => {
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

test.serial('new command', async t => {
  await coffee.fork(cli, ['new', '-h'], {
    cwd: resolve('plain'),
  })
    .expect('code', 0)
    .end();

  t.pass();
});

test.serial('subscriptions command', async t => {
  await coffee.fork(cli, ['subscriptions', '-h'], {
    cwd: resolve('plain'),
  })
    .expect('code', 0)
    .end();

  t.pass();
});

test.serial('check command', async t => {
  await coffee.fork(cli, ['check', 'custom'], {
    cwd: resolve('plain'),
  })
    .expect('code', 0)
    .debug()
    .end();

  t.pass();
});

test.serial('v2ray tls options', async t => {
  process.env.TEST_TLS13_ENABLE = 'true';
  process.env.TEST_SKIP_CERT_VERIFY_ENABLE = 'true';

  await coffee.fork(cli, ['generate'], {
    cwd: resolve('plain'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .expect('code', 0)
    .end();

  const confString1 = fs.readFileSync(resolve('plain/dist/v2rayn.conf'), {
    encoding: 'utf8',
  });
  const confString2 = fs.readFileSync(resolve('plain/dist/clash_mod.conf'), {
    encoding: 'utf8',
  });

  t.snapshot(confString1);
  t.snapshot(confString2);

  process.env.TEST_TLS13_ENABLE = undefined;
  process.env.TEST_SKIP_CERT_VERIFY_ENABLE = undefined;
});
