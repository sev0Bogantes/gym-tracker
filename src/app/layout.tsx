import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GymTracker — Your Personal Workout Log',
  description:
    'Track your gym routines, log weights, and measure week-by-week progress. Import your Excel routine and start tracking instantly.',
  keywords: ['gym tracker', 'workout log', 'fitness', 'weight training', 'progress'],
  openGraph: {
    title: 'GymTracker',
    description: 'Track your gym routines and measure progress week by week.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
