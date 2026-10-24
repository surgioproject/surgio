import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import CopyButton from './'

describe('<CopyButton />', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(
      <CopyButton text="modern value" onSuccess={onSuccess}>
        Copy
      </CopyButton>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('modern value')
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  test('falls back to a temporary textarea', async () => {
    const execCommand = vi.fn(() => true)
    const onSuccess = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    render(
      <CopyButton text="fallback value" onSuccess={onSuccess}>
        Copy
      </CopyButton>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
  })

  test('falls back when the Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Not allowed'))
    const execCommand = vi.fn(() => true)
    const onSuccess = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    render(
      <CopyButton text="retry value" onSuccess={onSuccess}>
        Copy
      </CopyButton>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('retry value')
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  test('reports a failed fallback', async () => {
    const onError = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })

    render(
      <CopyButton text="uncopied value" onError={onError}>
        Copy
      </CopyButton>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(onError).toHaveBeenCalledOnce()
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
  })
})
