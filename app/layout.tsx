import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { Providers } from '@/components/Providers'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CatRent — Аренда котов',
  description: 'Найди кота на выходные или сдай своего питомца в аренду',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${jakartaSans.className} bg-background min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
