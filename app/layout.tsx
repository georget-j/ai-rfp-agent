import type { Metadata } from 'next'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'AI RFP Agent — Enterprise Knowledge',
  description: 'AI-powered RFP response generation grounded in your internal knowledge base.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <AppHeader />
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
