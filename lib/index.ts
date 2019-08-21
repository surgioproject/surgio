import Command from 'common-bin';
import fs from 'fs';
import env2 from 'env2';
import path from 'path';

import CheckCommand from './command/check';
import GenerateCommand from './command/generate';
import SpeedCommand from './command/speed';
import UploadCommand from './command/upload';
import { normalizeConfig } from './utils';

const envPath = path.resolve(process.cwd(), './.env');

export class SurgioCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    if (fs.existsSync(envPath)) {
      env2(envPath);
    }

    this.usage = 'Usage: surgio <command> [options]';
    this.load(path.join(__dirname, './command'));
    this.yargs.alias('v', 'version');
  }
}

export {
  GenerateCommand,
  UploadCommand,
  CheckCommand,
  SpeedCommand,
};
