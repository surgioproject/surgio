// tslint:disable:no-expression-statement
import test from 'ava';
import fs from 'fs-extra';
import path from 'path';
import getEngine from '../lib/template';

const templateEngine = getEngine(process.cwd());

test('renderString #1', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `IP-CIDR,67.198.55.0/24,Proxy,no-resolve`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, `- IP-CIDR,67.198.55.0/24,Proxy`);
});

test('renderString #2', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `IP-CIDR,67.198.55.0/24,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, `- IP-CIDR,67.198.55.0/24,Proxy`);
});

test('renderString #3', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `PROCESS-NAME,Telegram,Proxy,no-resolve // test rule`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
});

test('renderString #4', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `# Comment`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '# Comment');
});

test('renderString #5', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `# Comment`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '# Comment');
});

test('renderString #6', t => {
  const body = `{{ str | patchYamlArray }}`;
  const str = `URL-REGEX,xxxxxxxxxxxx`;
  const result = templateEngine.renderString(body, {
    str,
  });

  t.is(result, '');
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

  t.is(templateEngine.renderString(`{{ str | mellow }}`, { str }), '');
  t.is(templateEngine.renderString(`{{ str | quantumultx }}`, { str }), '');
  t.is(templateEngine.renderString(`{{ str | patchYamlArray }}`, { str }), '');
});

test('ForeignMedia', t => {
  const str = fs.readFileSync(path.join(__dirname, './asset/ForeignMedia.list'), { encoding: 'utf8' });

  t.snapshot(templateEngine.renderString(`{{ str | quantumultx }}`, {
    str,
  }));
  t.snapshot(templateEngine.renderString(`{{ str | patchYamlArray }}`, {
    str,
  }));
  t.snapshot(templateEngine.renderString(`{{ str | mellow }}`, {
    str,
  }));
});
