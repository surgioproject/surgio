'use strict'

module.exports = {
  type: 'clash',
  url: 'http://artifact-test/masque.yaml',
  underlyingProxy: 'upstream',
  hooks: {
    afterNodeListResponse: () => [
      {
        type: 'masque',
        authMode: 'basic-auth',
        nodeName: 'masque-test',
        hostname: 'masque.example.com',
        port: 443,
        portHopping: '1234;5000-6000',
      },
    ],
  },
}
