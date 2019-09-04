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
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('plain'),
    execArgv: ['--require', require.resolve('./stub-axios.js')],
  })
    .debug()
    .end();

  t.is(code, 0);

  const confString = fs.readFileSync(resolve('plain/dist/ss_json.conf'), {
    encoding: 'utf8',
  });
  const conf = ini.decode(confString);

  t.truthy(fs.existsSync(resolve('plain/dist/ss.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/ssr.conf')));
  t.truthy(fs.existsSync(resolve('plain/dist/v2rayn.conf')));
  t.is(confString.split('\n')[0], '#!MANAGED-CONFIG https://example.com/ss_json.conf interval=43200 strict=false');
  t.is(Object.keys(conf.Proxy).length, 4);
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
