// tslint:disable:no-expression-statement
import test from 'ava';
import fs from 'fs-extra';
import path from 'path';
import getEngine from '../lib/template';

const templateEngine = getEngine(process.cwd(), 'https://example.com/');

test('clash #1', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `IP-CIDR,67.198.55.0/24,Proxy,no-resolve`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, `- IP-CIDR,67.198.55.0/24,Proxy`);
});

test('clash #2', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, `- IP-CIDR,67.198.55.0/24,Proxy`);
});

test('clash #3', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `PROCESS-NAME,Telegram,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
});

test('clash #4', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `# Comment`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '# Comment');
});

test('clash #5', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `# Comment`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '# Comment');
});

test('clash #6', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `URL-REGEX,xxxxxxxxxxxx`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
});

test('clash #7', t => {
  const body = `{{ str | clash }}`;

  t.is(templateEngine.renderString(body, { str: '# test' }), '# test');
  t.is(templateEngine.renderString(body, { str: '  ' }), '  ');
});

test('base64', t => {
  const body = `{{ str | base64 }}`;
  const str = `testtesttesttest`;

  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, 'dGVzdHRlc3R0ZXN0dGVzdA==');
});

test('quantumultx filter 1', t => {
  const body = `{{ str | quantumultx }}`;
  const str = `PROCESS-NAME,Telegram,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
});

test('quantumultx filter 2', t => {
  const body = `{{ str | quantumultx }}`;
  const str = fs.readFileSync(path.join(__dirname, './asset/surge-script-list.txt'), { encoding: 'utf8' });
  const result = templateEngine.renderString(body, {
    str,
  });

  t.snapshot(result);
});

test('mellow filter 1', t => {
  const body = `{{ str | mellow }}`;
  const str = `IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, 'IP-CIDR,67.198.55.0/24,Proxy');
});

test('mellow filter 2', t => {
  const body = `{{ str | mellow }}`;
  const str = `URL-REGEX,xxxxxxxxxxxx`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
});

test('mellow filter 3', t => {
  const body = `{{ str | mellow }}`;
  const str = `# Comment`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '# Comment');
});

test('spaces in string', t => {
  const str = `    `;

  t.is(templateEngine.renderString(`{{ str | mellow }}`, { str }), '    ');
  t.is(templateEngine.renderString(`{{ str | quantumultx }}`, { str }), '    ');
  t.is(templateEngine.renderString(`{{ str | patchYamlArray }}`, { str }), '    ');
});

test('ForeignMedia', t => {
  const str = fs.readFileSync(path.join(__dirname, './asset/ForeignMedia.list'), { encoding: 'utf8' });

  t.snapshot(templateEngine.renderString(`{{ str | quantumultx }}`, {
    str,
  }));
  t.snapshot(templateEngine.renderString(`{{ str | clash }}`, {
    str,
  }));
  t.snapshot(templateEngine.renderString(`{{ str | mellow }}`, {
    str,
  }));
});
