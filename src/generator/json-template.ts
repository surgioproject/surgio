import { join } from 'path'
import fs from 'fs-extra'

import type { ExtendContext, ExtendFunction } from './json-extend.js'

export * from './json-extend.js'

export const render = (
  templateDir: string,
  fileName: string,
  extend: (...args: any[]) => any,
  extendContext: ExtendContext,
): string => {
  const templatePath = join(templateDir, fileName)
  const jsonInput = fs.readJsonSync(templatePath)

  try {
    const jsonOutput = (extend as ReturnType<ExtendFunction>)(
      jsonInput,
      extendContext,
    )

    return JSON.stringify(jsonOutput, null, 2)
  } catch (error) {
    /* istanbul ignore next -- @preserve */
    if (error instanceof Error) {
      throw new Error(
        `Error when rendering JSON template ${fileName}: ${error.message}`,
        { cause: error },
      )
    }

    /* istanbul ignore next -- @preserve */
    throw new Error(`Error when rendering JSON template ${fileName}`, {
      cause: error,
    })
  }
}
