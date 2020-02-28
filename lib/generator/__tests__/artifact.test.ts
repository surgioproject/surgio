import test from 'ava';
import { join } from 'path';
import { loadConfig } from '../../utils/config';
import { Artifact } from '../artifact';
import { getEngine } from '../template';

const resolve = p => join(__dirname, '../../../test/fixture/', p);

test('new Artifact()', async t => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  });

  t.is(artifact.isReady, false);
  await artifact.init();
  t.is(artifact.isReady, true);

  await t.throwsAsync(async () => {
    await artifact.init();
  });
});

test('Artifact without templateEngine', async t => {
  const fixture = resolve('plain');
  const config = loadConfig(fixture, './surgio.conf.js');
  const artifact = new Artifact(config, {
    name: 'new_path.conf',
    template: 'test',
    provider: 'ss_json',
  });
  const templateEngine = getEngine(config.templateDir, config.publicUrl);

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
