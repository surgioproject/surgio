// istanbul ignore file
import OSS from 'ali-oss';
import Command from 'common-bin';
import fs from 'fs';
import dir from 'node-dir';
import ora, { Ora } from 'ora';
import path from 'path';

import { loadConfig } from '../utils/config';
import { errorHandler } from '../utils/error-helper';

class GenerateCommand extends Command {
  private readonly spinner: Ora;
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = '使用方法: surgio upload';
    this.spinner = ora();
    this.options = {
      o: {
        type: 'string',
        alias: 'output',
        description: '生成规则的目录',
      },
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
    const config = loadConfig(ctx.cwd, ctx.argv.config, {
      ...(ctx.argv.output ? {
        output: path.resolve(ctx.cwd, ctx.argv.output),
      } : null)
    });

    const ossConfig = {
      region: config?.upload?.region || 'oss-cn-hangzhou',
      bucket: config?.upload?.bucket,
      accessKeyId: ctx.env.OSS_ACCESS_KEY_ID || config?.upload?.accessKeyId,
      accessKeySecret: ctx.env.OSS_ACCESS_KEY_SECRET || config?.upload?.accessKeySecret,
    };
    const client = new OSS({
      secure: true,
      ...ossConfig,
    });
    const prefix = config?.upload?.prefix || '/';
    const fileList = await dir.promiseFiles(config.output);
    const files = fileList.map(filePath => ({
      fileName: path.basename(filePath),
      filePath,
    }));
    const fileNameList = files.map(file => file.fileName);

    const upload = () => {
      return Promise.all(files.map(file => {
        const { fileName, filePath } = file;
        const objectName = `${prefix}${fileName}`;
        const readStream = fs.createReadStream(filePath);

        return client.put(objectName, readStream, {
          mime: 'text/plain; charset=utf-8',
          headers: {
            'Cache-Control': 'private, no-cache, no-store',
          },
        });
      }));
    };
    const deleteUnwanted = async () => {
      const list = await client.list({
        prefix,
        delimiter: '/',
      });
      const deleteList: string[] = [];

      for (const key in list.objects) {
        if (list.objects.hasOwnProperty(key)) {
          const object = list.objects[key];
          const objectName = object.name.replace(prefix, '');
          const isExist = fileNameList.indexOf(objectName) > -1;

          if (objectName && !isExist) {
            deleteList.push(object.name);
          }
        }
      }

      if (deleteList.length) {
        await client.deleteMulti(deleteList);
      }
    };

    this.spinner.start('开始上传到阿里云 OSS');
    await upload();
    await deleteUnwanted();
    this.spinner.succeed();
  }

  public get description(): string {
    return '上传规则到阿里云 OSS';
  }

  public errorHandler(err): void {
    this.spinner.fail();

    errorHandler.call(this, err);
  }
}

export = GenerateCommand;
