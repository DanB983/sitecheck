import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Elephantfly Scan - Security & GDPR Compliance Scanner',
  description: 'Scan your website for security vulnerabilities and GDPR compliance issues',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster 
          richColors 
          closeButton 
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            },
            className: 'sonner-toast',
          }}
        />
      </body>
    </html>
  )
}

