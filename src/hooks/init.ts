import { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function (opts) {
  import('update-notifier').then(({ default: updateNotifier }) => {
    updateNotifier({ pkg: opts.config.pjson }).notify();
  });
};

export default hook;
