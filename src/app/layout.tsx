import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Iglesia Stats',
  description: 'Plataforma de estadísticas de encuentros',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${sora.variable}`}>
      <body className="bg-ink-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
