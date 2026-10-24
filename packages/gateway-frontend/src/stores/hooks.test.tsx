import { renderHook } from '@testing-library/react'

import { stores, useDownloadToken, useShareToken } from './'

describe('token hooks', () => {
  beforeEach(() => {
    stores.config.updateConfig({
      accessToken: 'access-token',
      viewerToken: 'viewer-token',
      urlAccessToken: null,
    })
  })

  test('download links prefer the URL access_token', () => {
    stores.config.updateConfig({ urlAccessToken: 'url-token' })

    expect(renderHook(() => useDownloadToken()).result.current).toBe(
      'url-token'
    )
  })

  test('download links fall back to the viewer token', () => {
    expect(renderHook(() => useDownloadToken()).result.current).toBe(
      'viewer-token'
    )
  })

  test('share links ignore the URL access_token', () => {
    stores.config.updateConfig({ urlAccessToken: 'url-token' })

    expect(renderHook(() => useShareToken()).result.current).toBe(
      'viewer-token'
    )
  })
})
