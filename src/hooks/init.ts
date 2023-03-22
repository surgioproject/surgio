import { Hook } from '@oclif/core';
import fs from 'fs-extra';
import { resolve } from 'path';
import dotenv from 'dotenv';

const envPath = resolve(process.cwd(), './.env');

const hook: Hook<'init'> = async function (opts) {
  // istanbul ignore next
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  import('update-notifier').then(({ default: updateNotifier }) => {
    updateNotifier({ pkg: opts.config.pjson }).notify();
  });
};

export default hook;
