import test from 'ava';
import { join } from 'path';
import { loadConfig } from '../../utils/config';
import { Artifact } from '../artifact';
import { getEngine } from '../template';

const resolve = p => join(__dirname, '../../../test/fixture/', p);

test('new Artifact()', async (t) => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  });
  const templateEngine = getEngine(config.templateDir);

  t.is(artifact.isReady, false);
  await artifact.init();
  t.is(artifact.isReady, true);

  t.notThrows(() => {
    artifact.render(templateEngine);
  });

  await t.throwsAsync(async () => {
    await artifact.init();
  });
});

test('Artifact without templateEngine', async (t) => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  });
  const templateEngine = getEngine(config.templateDir);

  t.throws(() => {
    artifact.render();
  });

  await artifact.init();

  t.throws(() => {
    artifact.render();
  });
  t.notThrows(() => {
    artifact.render(templateEngine);
  });
  await t.notThrowsAsync(async () => {
    const instance = await (
      new Artifact(config, {
        name: 'new_path.conf',
        template: 'test',
        provider: 'ss_json',
      }, { templateEngine })
    )
      .init();
    instance.render();
  });
});

test('render with extendRenderContext', async (t) => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const templateEngine = getEngine(config.templateDir);

  {
    const artifact = new Artifact(config, {
      name: 'new_path.conf',
      template: 'extend-render-context',
      provider: 'ss_json',
    }, { templateEngine });
    await artifact.init();

    t.snapshot(artifact.render());
  }

  {
    const artifact = new Artifact(config, {
      name: 'new_path.conf',
      template: 'extend-render-context',
      provider: 'ss_json',
      customParams: {
        foo: 'bar',
      },
    }, { templateEngine });
    await artifact.init();

    t.snapshot(artifact.render());
  }

  {
    const artifact = new Artifact(config, {
      name: 'new_path.conf',
      template: 'extend-render-context',
      provider: 'ss_json',
      customParams: {
        foo: 'bar',
      },
    }, { templateEngine });
    await artifact.init();

    t.snapshot(artifact.render(undefined, {
      urlParams: {
        foo: 'foo',
      },
    }));
  }
});

test('getRenderContext', async t => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const templateEngine = getEngine(config.templateDir);
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'extend-render-context',
    provider: 'ss_json',
  }, { templateEngine });

  await artifact.init();

  const ctx = artifact.getRenderContext();

  t.is(ctx.downloadUrl, 'https://example.com/new_path.conf?access_token=abcd');
  t.is(ctx.getUrl('/extend-provider?format=foo'), 'https://example.com/extend-provider?format=foo&access_token=abcd');
  t.is(ctx.getUrl('get-artifact/test.conf?format=foo'), 'https://example.com/get-artifact/test.conf?format=foo&access_token=abcd');
  t.is(ctx.getDownloadUrl('test.conf?format=foo'), 'https://example.com/test.conf?format=foo&access_token=abcd');
  t.deepEqual(ctx.customParams, {
    globalVariable: 'foo',
    globalVariableWillBeRewritten: 'bar',
    subLevel: {
      anotherVariableWillBeRewritten: 'value',
    },
  });
});
