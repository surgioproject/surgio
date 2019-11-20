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
    .get('/get-artifact/')
    .expect(404);
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
