import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { OCRProvider } from '@/contexts/ocr-context'
import { GlobalOCRModal } from '@/components/global-ocr-modal'
import { ToastProvider } from '@/contexts/toast-context'
import './globals.css'
import { AuthGate } from '@/components/auth-gate'

export const metadata: Metadata = {
  title: 'Classroom',
  description: 'NTUB 課程管理系統',
  generator: 'NTUB',
}

import { MembershipProvider } from '@/contexts/membership-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ToastProvider>
          <OCRProvider>
            <MembershipProvider>
              <AuthGate>
                {children}
              </AuthGate>
            </MembershipProvider>
            <GlobalOCRModal />
          </OCRProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
