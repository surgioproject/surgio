'use strict'

const execa = require('execa')
const { resolve } = require('path')
const fs = require('fs-extra')

const { argv } = process
const [, , example] = argv

if (!example) {
  console.error('Please provide an example name')
  process.exit(1)
}

const binPath = resolve(__dirname, '..', 'bin/run')
const examplePath = resolve(__dirname, '..', 'examples', example)
const nodeModulesPath = resolve(examplePath, 'node_modules')

fs.ensureDirSync(nodeModulesPath)
fs.ensureSymlinkSync(process.cwd(), resolve(nodeModulesPath, 'surgio'))

execa(binPath, ['generate', '--project', examplePath], { stdio: 'inherit' })
