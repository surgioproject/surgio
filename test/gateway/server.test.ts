import test from 'ava';
import { Server } from '../../lib/gateway/server';

test('getEditUrl', t => {
  t.is(Server.getEditUrl('http://example.com', 'name.conf'), 'http://example.com/name.conf');
  t.is(Server.getEditUrl('http://example.com/', 'name.conf'), 'http://example.com/name.conf');
  t.is(Server.getEditUrl({
    url: 'http://example.com/',
    type: 'git',
  }, 'name.conf'), 'http://example.com/name.conf');
  t.is(Server.getEditUrl(undefined, 'name.conf'), '');
});
