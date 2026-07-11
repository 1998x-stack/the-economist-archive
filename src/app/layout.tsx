import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Economist Archive',
    template: '%s — The Economist Archive',
  },
  description: 'Browse weekly issues of The Economist with full articles, editorial design, and powerful search.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-te-fg antialiased">
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  )
}
