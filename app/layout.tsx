import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Somil's Personal AI Agent",
  description: 'A voice-controlled, intelligent AI assistant created by Somil for personal use. Fully private and owned by Somil.',
  keywords: ['AI Agent', 'Voice Control', 'Personal Assistant', 'Somil'],
  authors: [{ name: 'Somil' }],
  creator: 'Somil',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
