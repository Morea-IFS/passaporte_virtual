import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { PwaBootstrap } from '@/components/pwa/pwa-bootstrap'
import { Montserrat, Nunito_Sans, Space_Mono } from 'next/font/google'
import { THEME_SCRIPT } from '@/lib/theme'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
})

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito-sans',
  subsets: ['latin'],
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Passaporte Virtual · 23ª SNCT',
  description: 'Passaporte digital da 23ª SNCT – Ciência Delas',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Passaporte' },
  icons: {
    icon: [{ url: '/icons/passport-192.png', type: 'image/png', sizes: '192x192' }],
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f2e9' },
    { media: '(prefers-color-scheme: dark)', color: '#140c2e' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} ${nunitoSans.variable} ${spaceMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only z-50 bg-surface p-4 font-bold text-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Ir para o conteúdo
        </a>
        {children}
        <Suspense fallback={null}>
          <PwaBootstrap />
        </Suspense>
      </body>
    </html>
  )
}
