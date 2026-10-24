import * as utils from './utils'

test('getDownloadUrl', () => {
  expect(utils.getDownloadUrl('test.conf')).toBe(
    'http://localhost/get-artifact/test.conf'
  )
  expect(utils.getDownloadUrl('test.conf', false)).toBe(
    'http://localhost/get-artifact/test.conf?dl=1'
  )
  expect(utils.getDownloadUrl('test.conf', false, 'abcd')).toBe(
    'http://localhost/get-artifact/test.conf?access_token=abcd&dl=1'
  )
  expect(utils.getDownloadUrl('test.conf?foo=bar', false)).toBe(
    'http://localhost/get-artifact/test.conf?foo=bar&dl=1'
  )
})
