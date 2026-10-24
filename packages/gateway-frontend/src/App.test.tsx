import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from './App'
import { validateCookie, validateToken } from './libs/http'
import { defaultFetcher } from './libs/utils'
import { stores } from './stores'

vi.mock('./libs/http', () => ({
  validateCookie: vi.fn(),
  validateToken: vi.fn(),
}))
vi.mock('./libs/utils', () => ({ defaultFetcher: vi.fn() }))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

describe('<App /> auth', () => {
  beforeEach(() => {
    stores.config.updateConfig({
      backendVersion: '',
      accessToken: null,
      viewerToken: null,
      urlAccessToken: null,
    })
    vi.mocked(defaultFetcher).mockResolvedValue({ backendVersion: '1.0.0' })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('keeps the URL access_token over the token resolved by the server', async () => {
    vi.mocked(validateToken).mockResolvedValue({
      roles: ['admin', 'viewer'],
      accessToken: 'cookie-token',
    })

    renderAt('/embed/artifact/demo.conf?access_token=url-token')

    await waitFor(() => expect(stores.config.isReady).toBe(true))
    expect(validateCookie).not.toHaveBeenCalled()
    expect(stores.config.config.accessToken).toBe('url-token')
    expect(stores.config.config.urlAccessToken).toBe('url-token')
  })

  test('uses the token resolved from the cookie without a URL access_token', async () => {
    vi.mocked(validateCookie).mockResolvedValue({
      roles: ['viewer'],
      accessToken: 'cookie-token',
    })

    renderAt('/embed/artifact/demo.conf')

    await waitFor(() => expect(stores.config.isReady).toBe(true))
    expect(stores.config.config.accessToken).toBe('cookie-token')
  })
})
