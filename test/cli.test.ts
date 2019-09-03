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
  })
    .end();
  const confString = (await fs.readFile(resolve('plain/dist/test.conf'))).toString();
  const conf = ini.decode(confString);

  t.is(code, 0);
  t.is(confString.split('\n')[0], '#!MANAGED-CONFIG https://example.com/test.conf interval=43200 strict=false');
  t.is(Object.keys(conf.Proxy).length, 4);
});

test('template error', async t => {
  const { code } = await coffee.fork(cli, ['generate'], {
    cwd: resolve('template-error'),
  })
    .debug()
    .end();

  t.is(code, 1);
});
