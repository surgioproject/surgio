import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import React, { useCallback, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCodeIcon } from 'lucide-react'

export interface QrCodeButtonProps {
  text: string
}

export default function QrCodeButton(props: QrCodeButtonProps) {
  const [qrValue, setQrValue] = useState<string>('')

  const handleClick = useCallback(() => {
    setQrValue(props.text)
  }, [props.text])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 px-0"
          aria-label="显示二维码"
          onClick={handleClick}
        >
          <QrCodeIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto h-auto p-0" side="top">
        {qrValue && (
          <div className="flex justify-center" data-text={props.text}>
            <QRCodeSVG marginSize={4} value={qrValue} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
