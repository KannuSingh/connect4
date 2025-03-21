import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AppKitProvider from "@/context/appkit-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Connect 4",
  description: "A modern Connect 4 game",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppKitProvider>
          {children}
        </AppKitProvider>
      </body>
    </html>
  )
}
