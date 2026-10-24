import * as path from 'path'
import './stub-request.js'

process.env.SURGIO_PROVIDER_CACHE_MAXAGE = '-1'
process.env.SURGIO_NETWORK_RETRY = '0'
process.env.SURGIO_PROJECT_DIR = path.join(
  import.meta.dirname,
  '__fixtures__/gateway'
)
