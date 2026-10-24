import React, { useCallback } from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  text: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Some browsers expose the API but reject it outside a trusted context.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    if (!document.execCommand?.('copy')) {
      throw new Error('Copy command was rejected')
    }
  } finally {
    textarea.remove()
  }
}

export default function CopyButton({
  text,
  onSuccess,
  onError,
  type = 'button',
  ...props
}: CopyButtonProps) {
  const handleClick = useCallback(async () => {
    try {
      await copyText(text)
      onSuccess?.()
    } catch (error) {
      onError?.(error)
    }
  }, [onError, onSuccess, text])

  return (
    <Button
      type={type}
      data-clipboard-text={text}
      onClick={handleClick}
      {...props}
    />
  )
}
