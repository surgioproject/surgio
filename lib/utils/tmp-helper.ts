import { createLogger } from '@surgio/logger';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

const logger = createLogger({ service: 'surgio:utils:tmp-helper' });
const tmpDir = path.join(os.tmpdir(), 'surgio-config');

logger.debug('tmpDir: %s', tmpDir);

export class TmpFile {
  public filename: string;
  public extname: string;

  constructor(public filePath: string, public maxAge?: number) {
    this.filename = path.basename(filePath);
    this.extname = path.extname(filePath);

    fs.accessSync(path.dirname(this.filePath), fs.constants.W_OK);
  }

  public async setContent(content: string): Promise<this> {
    const lastEditTime = new Date();
    await fs.writeJson(this.filePath, {
      content,
      maxAge: this.maxAge,
      lastEditTime: lastEditTime.getTime(),
    });

    return this;
  }

  public async getContent(): Promise<string> {
    const tmpContent = await this.validateContent();
    if (tmpContent) {
      return tmpContent.content;
    }
    return undefined;
  }

  private async validateContent(): Promise<TmpContent> {
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

export interface TmpContent { readonly content: string, readonly lastEditTime: number, readonly maxAge?: number }

export const createTmpFactory = (baseDir: string): ((filePath: string, maxAge?: number) => TmpFile) => {
  // tslint:disable-next-line:no-parameter-reassignment
  baseDir = path.join(tmpDir, baseDir);

  if (!fs.existsSync(baseDir)) {
    fs.mkdirpSync(baseDir);
  }

  return (filePath: string, maxAge?: number) => new TmpFile(path.join(baseDir, filePath), maxAge);
};
