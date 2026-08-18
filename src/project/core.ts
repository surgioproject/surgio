import type { SurgioProjectDefinition } from './types.js'

export const env = (key: string): string => {
  const value = process.env[key]
  if (value === undefined) {
    throw new Error(`环境变量 ${key} 未设置`)
  }
  return value
}

export const defineSurgioProject = <T extends SurgioProjectDefinition>(
  project: T,
): T => {
  if (!project || typeof project !== 'object') {
    throw new TypeError('Surgio project 必须是对象')
  }
  if (!Array.isArray(project.artifacts) || !project.providers) {
    throw new Error('Surgio project 必须提供 artifacts 和 providers')
  }
  return project
}
