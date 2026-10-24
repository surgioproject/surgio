import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'

import { TMP_FOLDER_NAME } from '../../constant/index.js'

import { DEFAULT_CACHE_NAMESPACE } from './utils.js'

import type { KvStore, KvStorePutOptions } from '../types.js'

interface FileRecord {
  key: string
  value: string
  expiresAt?: number
}

export interface FilesystemStoreOptions {
  directory?: string
  namespace?: string
}

export class FilesystemKvStore implements KvStore {
  readonly #directory: string

  constructor(options: FilesystemStoreOptions = {}) {
    this.#directory = path.join(
      options.directory ??
        process.env.SURGIO_CACHE_DIRECTORY ??
        path.join(os.tmpdir(), TMP_FOLDER_NAME, 'cache'),
      options.namespace ?? DEFAULT_CACHE_NAMESPACE,
    )
  }

  async get(key: string): Promise<string | undefined> {
    const filePath = this.#getFilePath(key)
    if (!(await fs.pathExists(filePath))) {
      return undefined
    }

    try {
      const record = (await fs.readJson(filePath)) as FileRecord
      if (record.expiresAt !== undefined && record.expiresAt <= Date.now()) {
        await fs.remove(filePath)
        return undefined
      }
      return record.key === key && typeof record.value === 'string'
        ? record.value
        : undefined
    } catch {
      await fs.remove(filePath)
      return undefined
    }
  }

  async put(
    key: string,
    value: string,
    options?: KvStorePutOptions,
  ): Promise<void> {
    await fs.ensureDir(this.#directory)
    const target = this.#getFilePath(key)
    const temporary = `${target}.${crypto.randomUUID()}.tmp`

    try {
      await fs.writeJson(temporary, {
        key,
        value,
        expiresAt: options?.expiresAt,
      } satisfies FileRecord)
      await fs.rename(temporary, target)
    } finally {
      await fs.remove(temporary)
    }
  }

  async delete(key: string): Promise<void> {
    await fs.remove(this.#getFilePath(key))
  }

  async *list(prefix = ''): AsyncIterable<string> {
    if (!(await fs.pathExists(this.#directory))) {
      return
    }

    const entries = await fs.readdir(this.#directory)
    for (const entry of entries) {
      if (!entry.endsWith('.json')) {
        continue
      }

      try {
        const record = (await fs.readJson(
          path.join(this.#directory, entry),
        )) as FileRecord
        if (record.expiresAt !== undefined && record.expiresAt <= Date.now()) {
          await fs.remove(path.join(this.#directory, entry))
          continue
        }
        if (typeof record.key === 'string' && record.key.startsWith(prefix)) {
          yield record.key
        }
      } catch {
        await fs.remove(path.join(this.#directory, entry))
      }
    }
  }

  async close(): Promise<void> {}

  #getFilePath(key: string): string {
    const hash = crypto.createHash('sha256').update(key).digest('hex')
    return path.join(this.#directory, `${hash}.json`)
  }
}

export const createFilesystemStore = (
  options?: FilesystemStoreOptions,
): KvStore => new FilesystemKvStore(options)
