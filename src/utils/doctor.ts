import check from 'check-node-version'
import { readJSON } from 'fs-extra'
import { join } from 'path'
import { PackageJson } from 'type-fest'
import { promisify } from 'util'

type OnComplete = Parameters<typeof check>[1]
type CheckInfo = Parameters<OnComplete>[1]

export const generateDoctorInfo = async (
  cwd: string,
  pjson: PackageJson,
): Promise<ReadonlyArray<string>> => {
  const doctorInfo: string[] = []
  const checkInfo = await promisify<CheckInfo>(check)()

  try {
    const gatewayPkg: PackageJson = await readJSON(
      join(cwd, 'node_modules/@surgio/gateway/package.json'),
    )
    doctorInfo.push(`@surgio/gateway: ${gatewayPkg.version}`)
  } catch (_) {
    // no catch
  }

  doctorInfo.push(`surgio: ${pjson.version} (${join(__dirname, '../..')})`)

  if (checkInfo) {
    Object.keys(checkInfo.versions).forEach((key) => {
      const version = checkInfo.versions[key].version
      if (version) {
        if (key === 'node') {
          doctorInfo.push(`${key}: ${version} (${process.execPath})`)
        } else {
          doctorInfo.push(`${key}: ${version}`)
        }
      }
    })
  }

  return doctorInfo
}
