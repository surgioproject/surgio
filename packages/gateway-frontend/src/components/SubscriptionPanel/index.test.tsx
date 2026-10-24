import React from 'react'
import { render, screen } from '@testing-library/react'
import { SWRConfig } from 'swr'

import { defaultFetcher } from '@/libs/utils'

import SubscriptionPanel from './'

vi.mock('@/libs/utils', () => ({ defaultFetcher: vi.fn() }))

test('shows Oixcloud subscription usage and expiry from the Gateway API', async () => {
  vi.mocked(defaultFetcher).mockImplementation(async (url) => {
    if (url === '/api/providers') {
      return [
        {
          name: 'Oixcloud',
          type: 'clash',
          url: 'https://provider.example/subscription',
          supportGetSubscriptionUserInfo: true,
        },
        {
          name: 'custom',
          type: 'custom',
          supportGetSubscriptionUserInfo: false,
        },
      ]
    }
    if (url === '/api/providers/Oixcloud/subscription') {
      return {
        upload: '1 KiB',
        download: '2 KiB',
        used: '3 KiB',
        left: '7 KiB',
        total: '10 KiB',
        expire: '2030-01-01 (about 3 years)',
      }
    }
    throw new Error(`Unexpected request: ${url}`)
  })

  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <SubscriptionPanel />
    </SWRConfig>
  )

  expect(await screen.findByText('7 KiB')).toBeInTheDocument()
  expect(screen.getByText('Oixcloud')).toBeInTheDocument()
  expect(screen.getByText('共 10 KiB')).toBeInTheDocument()
  expect(screen.getByText('已用流量').nextSibling).toHaveTextContent('3 KiB')
  expect(screen.getByText('有效期至').nextSibling).toHaveTextContent(
    '2030-01-01 (about 3 years)'
  )
  expect(screen.queryByText('没有可查询流量的订阅')).not.toBeInTheDocument()
})
