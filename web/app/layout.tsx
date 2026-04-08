import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { SessionProvider } from '@/components/session-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'club-os',
  description: 'The operating system for amateur cricket clubs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased" suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
