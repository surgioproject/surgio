const path = require('path')
const chai = require('chai')
const chaiJestSnapshot = require('chai-jest-snapshot')

chai.use(chaiJestSnapshot)

process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
process.env.NODE_ENV = 'development'

global.oclif = global.oclif || {}
global.oclif.columns = 80

exports.mochaHooks = async () => {
  return {
    before() {
      chaiJestSnapshot.resetSnapshotRegistry()
    },
    beforeEach() {
      chaiJestSnapshot.configureUsingMochaContext(this)
    },
  }
}
