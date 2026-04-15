import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'ARM Merch',
  description: 'Sistema de Merch',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3500}
        />
      </body>
    </html>
  )
}