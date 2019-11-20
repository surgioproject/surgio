import test from 'ava';
import { Server } from '../../lib/gateway/server';

test('getEditUrl', t => {
  t.is(Server.getEditUrl('https://example.com', 'name.conf'), 'https://example.com/name.conf');
  t.is(Server.getEditUrl('https://example.com/', 'name.conf'), 'https://example.com/name.conf');
  t.is(Server.getEditUrl({
    url: 'https://example.com/',
    type: 'git',
  }, 'name.conf'), 'https://example.com/name.conf');
  t.is(Server.getEditUrl(undefined, 'name.conf'), '');
});
