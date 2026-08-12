import './stub-axios.js'
import { transports } from '@surgio/logger'

process.env.NODE_ENV = 'development'

// Aggregate imports attach one Surgio module logger to the shared transport.
transports.console.setMaxListeners(100)

const globalWithOclif = globalThis as typeof globalThis & {
  oclif?: { columns?: number }
}

globalWithOclif.oclif ??= {}
globalWithOclif.oclif.columns = 80
