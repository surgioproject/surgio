import path from 'node:path'

import { startServer } from './node.js'

const projectDir = process.env.SURGIO_PROJECT_DIR

startServer({ cwd: projectDir ? path.resolve(projectDir) : undefined })
