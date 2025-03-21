"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleStartGame = () => {
    if (!playerName.trim()) return

    setIsStarting(true)

    // Store player name in localStorage
    localStorage.setItem("playerName", playerName)

    // Navigate to game page
    router.push("/game")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex gap-1 mb-6">
        <div className="w-12 h-12 rounded-full bg-accent-red"></div>
        <div className="w-12 h-12 rounded-full bg-accent-yellow"></div>
        <div className="w-12 h-12 rounded-full bg-accent-yellow"></div>
        <div className="w-12 h-12 rounded-full bg-accent-red"></div>
      </div>

      <h1 className="text-4xl font-bold text-white mb-8">CONNECT 4</h1>

      <div className="bg-primary rounded-lg shadow-game p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome!</h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium mb-2">
              Enter Your Name
            </label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Name"
              className="w-full p-3 border rounded-md"
              maxLength={15}
            />
          </div>

          <Button
            onClick={handleStartGame}
            disabled={!playerName.trim() || isStarting}
            className="w-full bg-accent-red hover:bg-accent-red/90 text-white py-3 rounded-lg font-bold shadow-game"
          >
            {isStarting ? "Starting..." : "Play vs CPU"}
          </Button>
        </div>
      </div>
    </div>
  )
}

