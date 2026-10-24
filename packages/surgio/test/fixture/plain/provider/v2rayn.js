'use strict'

module.exports = {
  url: 'http://example.com/test-v2rayn-sub.txt',
  type: 'v2rayn_subscribe',
  tls13: process.env.TEST_TLS13_ENABLE === 'true',
  skipCertVerify: process.env.TEST_SKIP_CERT_VERIFY_ENABLE === 'true',
}
