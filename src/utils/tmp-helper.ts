import { createLogger } from '@surgio/logger'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import Redis from 'ioredis'

import { TMP_FOLDER_NAME } from '../constant'
import redis from '../redis'
import { msToSeconds } from './index'

const logger = createLogger({ service: 'surgio:utils:tmp-helper' })
const tmpDir = path.join(os.tmpdir(), TMP_FOLDER_NAME)

abstract class TmpHelper {
  protected constructor(public cacheKey: string, public maxAge?: number) {}

  public abstract setContent(content: string): Promise<void>

  public abstract getContent(): Promise<string | undefined>
}

export class TmpFile implements TmpHelper {
  constructor(public cacheKey: string, public maxAge?: number) {
    fs.accessSync(path.dirname(this.cacheKey), fs.constants.W_OK)
  }

  public async setContent(content: string): Promise<void> {
    await fs.writeJson(this.cacheKey, {
      content,
      maxAge: this.maxAge,
      lastEditTime: new Date().getTime(),
    })
  }

  public async getContent(): Promise<string | undefined> {
    const tmpContent = await this.validateContent()
    if (tmpContent) {
      return tmpContent.content
    }
    return undefined
  }

  private async validateContent(): Promise<TmpContent | undefined> {
    if (!fs.existsSync(this.cacheKey)) {
      return undefined
    }

    const tmpContent: TmpContent = await fs.readJson(this.cacheKey)
    const now = Date.now()

    if (!tmpContent.maxAge) {
      return tmpContent
    } else if (this.maxAge && now - tmpContent.lastEditTime < this.maxAge) {
      return tmpContent
    } else if (!this.maxAge && tmpContent.maxAge) {
      this.maxAge = tmpContent.maxAge
    }

    return undefined
  }
}

export class TmpRedis implements TmpHelper {
  private redisClient: Redis

  constructor(public cacheKey: string, public maxAge?: number) {
    this.redisClient = redis.getRedis()
  }

  public async getContent(): Promise<string | undefined> {
    const value = await this.redisClient.get(this.cacheKey)

    return value ? value : undefined
  }

  public async setContent(content: string): Promise<void> {
    if (this.maxAge) {
      await this.redisClient.set(
        this.cacheKey,
        content,
        'EX',
        msToSeconds(this.maxAge),
      )
    } else {
      await this.redisClient.set(this.cacheKey, content)
    }
  }
}

export interface TmpContent {
  readonly content: string
  readonly lastEditTime: number
  readonly maxAge?: number
}

export const createTmpFactory = (
  baseDir: string,
  cacheType: 'default' | 'redis' = 'default',
): ((filePath: string, maxAge?: number) => TmpFile | TmpRedis) => {
  logger.debug('tmpDir: %s', baseDir)
  logger.debug('tmpDir cache type: %s', cacheType)

  if (cacheType === 'default') {
    const fullTmpDir = path.join(tmpDir, baseDir)

    if (!fs.existsSync(fullTmpDir)) {
      fs.mkdirpSync(fullTmpDir)
    }

    return (fileCacheKey: string, maxAge?: number) =>
      new TmpFile(path.join(fullTmpDir, fileCacheKey), maxAge)
  } else {
    return (fileCacheKey: string, maxAge?: number) =>
      new TmpRedis(`${baseDir}:${fileCacheKey}`, maxAge)
  }
}
