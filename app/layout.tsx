import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreyFlow',
  description: 'Create free AI workflows',
  generator: 'greyapi',
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
