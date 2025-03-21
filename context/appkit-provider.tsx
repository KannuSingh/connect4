'use client'

import { createAppKit } from '@reown/appkit'
import { solanaWeb3JsAdapter, projectId, networks } from '@/config'

// Set up metadata
const metadata = {
  name: 'Connect 4 Game',
  description: 'A modern Connect 4 game with Solana integration',
  url: 'https://connect4-game.example.com', 
  icons: []
}

// Create the modal
export const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true 
  }
})


export default function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
} 