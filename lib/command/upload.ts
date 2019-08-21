import OSS from 'ali-oss';
import assert from 'assert';
import Command from 'common-bin';
import fs from 'fs';
import dir from 'node-dir';
import ora, { Ora } from 'ora';
import path from "path";

import { loadConfig } from '../utils';

class GenerateCommand extends Command {
  private readonly spinner: Ora;
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: surgio upload';
    this.spinner = ora();
    this.options = {
      output: {
        type: 'string',
        alias: 'o',
        description: 'folder for saving files',
      },
      config: {
        alias: 'c',
        default: './surgio.conf.js',
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
      region: config.upload.region,
      bucket: config.upload.bucket,
      accessKeyId: ctx.env.OSS_ACCESS_KEY_ID || config.upload.accessKeyId,
      accessKeySecret: ctx.env.OSS_ACCESS_KEY_SECRET || config.upload.accessKeySecret,
    };

    assert(ossConfig.bucket);
    assert(ossConfig.accessKeyId);
    assert(ossConfig.accessKeySecret);

    const client = new OSS({
      secure: true,
      ...ossConfig,
    });
    const { prefix } = config.upload;
    const fileList = await dir.promiseFiles(config.output);
    const files = fileList.map(filePath => ({
      fileName: filePath.split('/').slice(-1)[0],
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
      const deleteList = [];

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

    this.spinner.start('Start uploading to Aliyun OSS');
    await upload();
    await deleteUnwanted();
    this.spinner.succeed();
  }

  public get description(): string {
    return 'Upload configurations to Aliyun OSS';
  }

  public errorHandler(err): void {
    this.spinner.fail();

    super.errorHandler(err);
  }
}

export = GenerateCommand;
