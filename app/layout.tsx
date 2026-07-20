import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { RootProviders } from '@/providers/root-providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: 'Nexus V1 - All-in-One Collaboration & Productivity Platform',
    template: '%s | Nexus V1',
  },
  description: 'Nexus V1 is a premium, real-time collaboration and workspace productivity platform. Manage projects, assign tasks, write notes with Tiptap, coordinate calendars, and chat live in one integrated dashboard.',
  keywords: ['nexus', 'collaboration', 'project management', 'saas', 'productivity', 'task manager', 'real-time chat', 'tiptap editor'],
  authors: [{ name: 'Nexus Team' }],
  creator: 'Nexus V1 Team',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nexus-v1.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexus-v1.vercel.app',
    title: 'Nexus V1 - All-in-One Collaboration & Productivity Platform',
    description: 'Nexus V1 unifies your projects, tasks, collaborative notes, real-time chats, and calendars into a single, beautifully simple workspace.',
    siteName: 'Nexus V1',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus V1 - All-in-One Collaboration & Productivity Platform',
    description: 'Nexus V1 unifies your projects, tasks, collaborative notes, real-time chats, and calendars into a single integrated workspace.',
    creator: '@nexus_v1',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
