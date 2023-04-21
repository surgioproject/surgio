// istanbul ignore file
import { Flags } from '@oclif/core';
import OSS from 'ali-oss';
import fs from 'fs-extra';
import dir from 'node-dir';
import path from 'path';

import BaseCommand from '../base-command';
import redis from '../redis';
import { setConfig } from '../config';

class UploadCommand extends BaseCommand<typeof UploadCommand> {
  static description = '上传规则到阿里云 OSS';

  public async run(): Promise<void> {
    const config = this.surgioConfig;

    if (this.flags.output) {
      setConfig('output', this.flags.output);
    }

    const ossConfig = {
      region: config?.upload?.region,
      bucket: config?.upload?.bucket,
      endpoint: config?.upload?.endpoint,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || config?.upload?.accessKeyId,
      accessKeySecret:
        process.env.OSS_ACCESS_KEY_SECRET || config?.upload?.accessKeySecret,
    };
    const client = new OSS({
      secure: true,
      ...ossConfig,
    });
    const prefix = config?.upload?.prefix || '/';
    const fileList = await dir.promiseFiles(config.output);
    const files = fileList.map((filePath) => ({
      fileName: path.basename(filePath),
      filePath,
    }));
    const fileNameList = files.map((file) => file.fileName);

    const upload = () => {
      return Promise.all(
        files.map((file) => {
          const { fileName, filePath } = file;
          const objectName = `${prefix}${fileName}`;
          const readStream = fs.createReadStream(filePath);

          return client.put(objectName, readStream, {
            mime: 'text/plain; charset=utf-8',
            headers: {
              'Cache-Control': 'private, no-cache, no-store',
            },
          });
        }),
      );
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

    this.ora.start('开始上传到阿里云 OSS');
    await upload();
    await deleteUnwanted();
    await redis.destroyRedis();
    this.ora.succeed();
  }
}

UploadCommand.flags = {
  output: Flags.string({
    char: 'o',
    description: '生成规则的目录',
  }),
};

export default UploadCommand;
