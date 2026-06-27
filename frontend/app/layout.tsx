import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter, DM_Mono, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ARIN Climate DSS | AI-Driven Climate Data Processing Pipeline',
  description: 'An extensible AI-driven end-to-end climate data processing pipeline for the Africa Research and Impact Network (ARIN). Transforming climate research into actionable insights across Africa.',
  keywords: ['climate data', 'AI', 'Africa', 'ARIN', 'decision support system', 'sustainable development', 'climate change'],
  authors: [{ name: 'Africa Research and Impact Network' }],
  openGraph: {
    title: 'ARIN Climate DSS | AI-Driven Climate Data Processing Pipeline',
    description: 'Transforming climate research into actionable insights across Africa',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${dmMono.variable} ${cormorantGaramond.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
