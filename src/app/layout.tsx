import type { Metadata, Viewport } from 'next'
import { Geist, DM_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Nav } from '@/components/nav'
import { Toaster } from 'sonner'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents iOS Safari zoom on input focus
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0c' }
  ],
  viewportFit: 'cover', // Ensures rendering into the safe areas on iOS
}

export const metadata: Metadata = {
  title: 'Conduit — AI Workflow Execution Platform',
  description: 'Run AI workflows that produce real, verifiable outcomes. Step-by-step execution plans, editable prompt templates, and built-in validation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${dmSans.variable} ${geistMono.variable} font-dm-sans`}>
        {/*
          Notice: body overflow is managed globally by globals.css
          and scroll-locked dynamically by bottom-sheets/drawers using JS.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Nav />
            <main>{children}</main>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
