import test from 'ava';
import path from 'path';
import request from 'supertest';
import { JSDOM } from 'jsdom';

import * as gateway from '../../lib/gateway';

test('will work', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/')
    .expect(200)
    .then(res => {
      t.is(res.text, 'Surgio Gateway');
    });

  await request(httpServer)
    .get('/robot.txt')
    .expect(200)
    .then(res => {
      t.is(res.text, 'User-agent: *\n' +
        'Disallow: /');
    });
});

test('koa application', t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const surgioServer = gateway.createSurgioServer(fixture);
  const app = gateway.createKoaApp(surgioServer);

  t.deepEqual(surgioServer.config, app.surgioConfig);
});

test('get artifact', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/get-artifact/test.conf')
    .expect(200)
    .then(res => {
      t.snapshot(res.text);
    });

  await request(httpServer)
    .get('/get-artifact/test.conf?dl=1')
    .expect(200)
    .expect('content-disposition', 'attachment; filename="test.conf"');

  await request(httpServer)
    .get('/get-artifact/')
    .expect(404);

  await request(httpServer)
    .get('/get-artifact/notfound.conf')
    .expect(404);
});

test('transform artifact surge', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/get-artifact/test.conf?format=surge-policy')
    .expect(200)
    .then(res => {
      t.snapshot(res.text);
    });

  await request(httpServer)
    .get('/get-artifact/test.conf?format=surge-policy&filter=usFilter')
    .expect(200)
    .then(res => {
      t.snapshot(res.text);
    });
});

test('transform artifact qx', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/get-artifact/test.conf?format=qx-server')
    .expect(200)
    .then(res => {
      t.snapshot(res.text);
    });

  await request(httpServer)
    .get('/get-artifact/test.conf?format=qx-server&filter=globalFilter')
    .expect(200)
    .then(res => {
      t.snapshot(res.text);
    });
});

test('transform artifact unknown format and filter', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/get-artifact/notfound.conf')
    .expect(404);

  await request(httpServer)
    .get('/get-artifact/test.conf?format=unknown-format')
    .expect(400)
    .then(res => {
      t.true(res.text.includes('unsupported format'));
    });

  await request(httpServer)
    .get('/get-artifact/test.conf?format=surge-policy&filter=unknown-filter')
    .expect(200);
});

test('list artifact', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const httpServer = gateway.createHttpServer({
    cwd: fixture,
  });

  await request(httpServer)
    .get('/list-artifact')
    .expect(200)
    .then(res => {
      const { window } = new JSDOM(res.text);
      const $container = window.document.querySelector('.container');
      const $artifacts = $container.querySelectorAll('.artifact');

      t.is($artifacts.length, 1);
      t.snapshot($container.querySelector('ul').innerHTML);
    });
});

test('auth', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const surgioServer = gateway.createSurgioServer(fixture);
  const app = gateway.createKoaApp(surgioServer);

  // @ts-ignore
  app.surgioConfig.gateway.auth = true;

  await request(app.callback())
    .get('/list-artifact')
    .expect(401)
    .then(res => {
      t.true(res.text.includes('invalid access_token'));
    });

  await request(app.callback())
    .get('/list-artifact?access_token=abcd')
    .expect(200);
});

test('qx-script', async t => {
  const fixture = path.join(__dirname, '../fixture/gateway');
  const surgioServer = gateway.createSurgioServer(fixture);
  const app = gateway.createKoaApp(surgioServer);

  const res1 = await request(app.callback())
    .get('/qx-script?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrossutility%2FQuantumult-X%2Fmaster%2Fsample-rewrite-with-script.js');
  const res2 = await request(app.callback())
    .get('/qx-script?id=abcdef&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrossutility%2FQuantumult-X%2Fmaster%2Fsample-rewrite-with-script.js');
  const res3 = await request(app.callback())
    .get('/qx-script?id=abcdef,bcdefg&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrossutility%2FQuantumult-X%2Fmaster%2Fsample-rewrite-with-script.js');
  const res4 = await request(app.callback())
    .get('/qx-script?id=abcdef&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrossutility%2FQuantumult-X%2Fmaster%2Fsample-rewrite-with-script.js');

  t.snapshot(res1.body.toString());
  t.snapshot(res2.body.toString());
  t.snapshot(res3.body.toString());
  t.snapshot(res4.body.toString());
});
