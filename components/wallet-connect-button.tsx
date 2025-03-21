'use client'

import { Button } from "@/components/ui/button"
import { useAppKit } from '@reown/appkit/react'

export function WalletConnectButton() {
  const { open } = useAppKit()

  return (
    <Button
      onClick={() => open()}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow-game"
    >
      Connect Solana Wallet
    </Button>
  )
}