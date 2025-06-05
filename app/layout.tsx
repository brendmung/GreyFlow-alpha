import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreyFlow',
  description: 'Create AI Workflows',
  generator: 'greyflow',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
