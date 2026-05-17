import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/components/providers/AppProvider'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Taskora — ระบบบริหารจัดการคำร้อง',
  description: 'ระบบบริหารจัดการงานและคำร้องภายในองค์กร',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={sarabun.variable}>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
