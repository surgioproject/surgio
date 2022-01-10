import { createLogger } from '@surgio/logger';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

import { TMP_FOLDER_NAME } from '../constant';

const logger = createLogger({ service: 'surgio:utils:tmp-helper' });
const tmpDir = path.join(os.tmpdir(), TMP_FOLDER_NAME);

export class TmpFile {
  public filename: string;
  public extname: string;

  constructor(public filePath: string, public maxAge?: number) {
    this.filename = path.basename(filePath);
    this.extname = path.extname(filePath);

    fs.accessSync(path.dirname(this.filePath), fs.constants.W_OK);
  }

  public async setContent(content: string): Promise<this> {
    await fs.writeJson(this.filePath, {
      content,
      maxAge: this.maxAge,
      lastEditTime: new Date().getTime(),
    });

    return this;
  }

  public async getContent(): Promise<string | undefined> {
    const tmpContent = await this.validateContent();
    if (tmpContent) {
      return tmpContent.content;
    }
    return undefined;
  }

  private async validateContent(): Promise<TmpContent | undefined> {
    if (!fs.existsSync(this.filePath)) {
      return undefined;
    }

    const tmpContent: TmpContent = await fs.readJson(this.filePath);
    const now = Date.now();

    if (!tmpContent.maxAge) {
      return tmpContent;
    } else if (this.maxAge && now - tmpContent.lastEditTime < this.maxAge) {
      return tmpContent;
    } else if (!this.maxAge && tmpContent.maxAge) {
      this.maxAge = tmpContent.maxAge;
    }

    return undefined;
  }
}

export interface TmpContent {
  readonly content: string;
  readonly lastEditTime: number;
  readonly maxAge?: number;
}

export const createTmpFactory = (
  baseDir: string,
): ((filePath: string, maxAge?: number) => TmpFile) => {
  baseDir = path.join(tmpDir, baseDir);

  logger.debug('tmpDir: %s', baseDir);

  if (!fs.existsSync(baseDir)) {
    fs.mkdirpSync(baseDir);
  }

  return (filePath: string, maxAge?: number) =>
    new TmpFile(path.join(baseDir, filePath), maxAge);
};
