import path from 'node:path'
import fs from 'fs-extra'

export const SURGIO_PROJECT_FILENAMES = [
  'surgio.project.ts',
  'surgio.project.mts',
  'surgio.project.mjs',
  'surgio.project.js',
] as const

export const findSurgioProjectFiles = (cwd: string): string[] =>
  SURGIO_PROJECT_FILENAMES.map((filename) => path.join(cwd, filename)).filter(
    (filename) => fs.existsSync(filename),
  )

export const resolveSurgioProjectFile = (
  cwd: string,
  options: { readonly required?: boolean } = {},
): string | undefined => {
  const files = findSurgioProjectFiles(cwd)
  if (files.length > 1) {
    throw new Error(`项目包含多个 Surgio Project 入口：${files.join(', ')}`)
  }
  if (!files.length && options.required) {
    throw new Error(
      `项目缺少 Surgio Project 入口（${SURGIO_PROJECT_FILENAMES.join(', ')}）`,
    )
  }
  return files[0]
}
