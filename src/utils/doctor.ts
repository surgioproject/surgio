import { join } from 'path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'util'
import check from 'check-node-version'
import fs from 'fs-extra'
import { PackageJson } from 'type-fest'

type OnComplete = Parameters<typeof check>[1]
type CheckInfo = Parameters<OnComplete>[1]

export const generateDoctorInfo = async (
  cwd: string,
  pjson: PackageJson,
): Promise<ReadonlyArray<string>> => {
  const doctorInfo: string[] = []
  const checkInfo = await promisify<CheckInfo>(check)().catch(() => null)

  try {
    const gatewayPkg: PackageJson = await fs.readJSON(
      join(cwd, 'node_modules/@surgio/gateway/package.json'),
    )
    doctorInfo.push(`@surgio/gateway: ${gatewayPkg.version}`)
  } catch {
    // no catch
  }

  doctorInfo.push(
    `surgio: ${pjson.version} (${fileURLToPath(new URL('../..', import.meta.url))})`,
  )
  doctorInfo.push(`node: ${process.version} (${process.execPath})`)

  if (checkInfo) {
    Object.keys(checkInfo.versions).forEach((key) => {
      const version = checkInfo.versions[key].version
      if (version && key !== 'node') {
        doctorInfo.push(`${key}: ${version}`)
      }
    })
  }

  return doctorInfo
}
