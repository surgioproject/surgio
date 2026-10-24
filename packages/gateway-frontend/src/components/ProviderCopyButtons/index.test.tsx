import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnackbarProvider } from 'notistack'

import ProviderCopyButtons from './'

describe('<ProviderCopyButtons />', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'ResizeObserver', {
      configurable: true,
      value: class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    })

    Object.defineProperties(HTMLElement.prototype, {
      hasPointerCapture: {
        configurable: true,
        value: vi.fn(() => false),
      },
      releasePointerCapture: {
        configurable: true,
        value: vi.fn(),
      },
      scrollIntoView: {
        configurable: true,
        value: vi.fn(),
      },
      setPointerCapture: {
        configurable: true,
        value: vi.fn(),
      },
    })
  })

  test('renders component', () => {
    const { getByTestId } = render(
      <SnackbarProvider>
        <ProviderCopyButtons providerNameList={['test']} />
      </SnackbarProvider>
    )
    const $copyButton = getByTestId('copy-button')
    const $changeTypeButton = getByTestId('format-select')

    expect($copyButton).toBeInTheDocument()
    expect($copyButton.textContent).toBe('复制')
    expect($changeTypeButton).toBeInTheDocument()
  })

  test('copies a Loon provider URL', async () => {
    const user = userEvent.setup()

    render(
      <SnackbarProvider>
        <ProviderCopyButtons providerNameList={['first', 'second']} />
      </SnackbarProvider>
    )

    await user.click(screen.getByTestId('format-select'))
    await user.click(await screen.findByText('Loon Proxy'))

    expect(screen.getByTestId('copy-button')).toHaveAttribute(
      'data-clipboard-text',
      `${window.location.origin}/export-providers?providers=first%2Csecond&format=loon`
    )
  })
})
