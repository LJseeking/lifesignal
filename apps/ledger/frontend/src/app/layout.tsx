import './globals.css'

export const metadata = {
  title: 'Credits Ledger',
  description: 'v0.6 Production Ready',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
