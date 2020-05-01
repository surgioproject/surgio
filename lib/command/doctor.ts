// istanbul ignore file
import Command from 'common-bin';
import check from 'check-node-version';
import { promisify } from 'util';
import { join } from 'path';
import { isPkgBundle } from '../utils';

import { errorHandler } from '../utils/error-helper';

type OnComplete = Parameters<typeof check>[1];
type CheckInfo = Parameters<OnComplete>[1];

class DoctorCommand extends Command {
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = '使用方法: surgio doctor';
    this.options = {
      c: {
        alias: 'config',
        demandOption: false,
        describe: 'Surgio 配置文件',
        default: './surgio.conf.js',
        type: 'string',
      },
    };
  }

  public async run(ctx): Promise<void> {
    const doctorInfo = await DoctorCommand.generateDoctorInfo(ctx.cwd);

    doctorInfo.forEach(item => {
      console.log(item);
    });
  }

  public get description(): string {
    return '检查运行环境';
  }

  public errorHandler(err): void {
    errorHandler.call(this, err);
  }

  public static async generateDoctorInfo(cwd: string): Promise<ReadonlyArray<string>> {
    const doctorInfo: string[] = [];
    const pkg = require('../../package.json');
    const checkInfo = isPkgBundle() ? null : await promisify<CheckInfo>(check)();

    try {
      const gatewayPkg = require(join(cwd, 'node_modules/@surgio/gateway/package.json'));
      doctorInfo.push(`@surgio/gateway: ${gatewayPkg.version}`);
    } catch(_) {
      // no catch
    }

    doctorInfo.push(`surgio: ${pkg.version}`);

    if (checkInfo) {
      Object.keys(checkInfo.versions).forEach(key => {
        const version = checkInfo.versions[key].version;
        if (version) {
          if (key === 'node') {
            doctorInfo.push(`${key}: ${version} (${process.execPath})`);
          } else {
            doctorInfo.push(`${key}: ${version}`);
          }
        }
      });
    }

    return doctorInfo;
  }
}

export = DoctorCommand;
