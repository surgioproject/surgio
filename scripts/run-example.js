import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import fs from 'fs-extra'

const { argv } = process
const [, , example] = argv

if (!example) {
  console.error('Please provide an example name')
  process.exit(1)
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const binPath = resolve(scriptDir, '..', 'bin/run')
const examplePath = resolve(scriptDir, '..', 'examples', example)
const nodeModulesPath = resolve(examplePath, 'node_modules')

fs.ensureDirSync(nodeModulesPath)
fs.ensureSymlinkSync(process.cwd(), resolve(nodeModulesPath, 'surgio'))

execa(binPath, ['generate', '--project', examplePath], { stdio: 'inherit' })
