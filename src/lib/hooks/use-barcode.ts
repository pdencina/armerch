'use client'

import { useEffect } from 'react'

export function useBarcode(onScan: (code: string) => void) {
  useEffect(() => {
    let buffer = ''
    let lastTime = Date.now()

    function handleKey(e: KeyboardEvent) {
      const now = Date.now()

      // Si pasa mucho tiempo entre teclas → reinicia
      if (now - lastTime > 100) buffer = ''

      lastTime = now

      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          onScan(buffer)
        }
        buffer = ''
        return
      }

      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        buffer += e.key
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onScan])
}