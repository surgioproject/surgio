import test from 'ava';

import relayableUrl from '../relayable-url';

test('relayableUrl', t => {
  t.is(
    relayableUrl('http://example.com', true),
    'https://surgio-cors.herokuapp.com/http://example.com'
  );
  t.is(
    relayableUrl('http://example.com', 'http://proxy.example.com/%URL%'),
    'http://proxy.example.com/http://example.com'
  );
  t.is(
    relayableUrl('http://example.com', 'http://proxy.example.com/?url=%%URL%%'),
    'http://proxy.example.com/?url=http%3A%2F%2Fexample.com'
  );
  t.is(
    relayableUrl('http://example.com'),
    'http://example.com'
  );
  t.throws(() => {
    relayableUrl('http://example.com', 'http://proxy.example.com/');
  }, undefined, 'relayUrl 中必须包含 %URL% 或 %%URL%% 替换指示符');
});
