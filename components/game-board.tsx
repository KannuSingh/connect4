"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SmileIcon, Bot } from "lucide-react"
import type { GameState } from "@/lib/game-engine"

export default function GameBoard() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState<string>("Player 1")
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameId, setGameId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [turnTimer, setTurnTimer] = useState(10)
  const [timerActive, setTimerActive] = useState(true)
  const [isCpuThinking, setIsCpuThinking] = useState(false)
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)

  // Load player name and game ID on mount
  useEffect(() => {
    const storedName = localStorage.getItem("playerName")
    if (storedName) {
      setPlayerName(storedName)
    }
    
    // Try to retrieve game ID from localStorage
    const storedGameId = localStorage.getItem("gameId")
    if (storedGameId) {
      setGameId(storedGameId)
    }
  }, [])

  // Initialize game on mount - modified to use stored game ID if available
  useEffect(() => {
    if (gameId) {
      // If we have a stored game ID, try to fetch its state
      fetchGameState(gameId)
    } else {
      // Otherwise initialize a new game
      initializeGame()
    }
  }, [])

  // Reset turn timer when player changes
  useEffect(() => {
    if (gameState) {
      setTurnTimer(10)
    }
  }, [gameState?.currentPlayer])

  // Update localStorage whenever gameId changes
  useEffect(() => {
    if (gameId) {
      try {
        localStorage.setItem("gameId", gameId);
        console.log('Game ID saved to localStorage:', gameId);
      } catch (err) {
        console.error('Failed to save game ID to localStorage:', err);
      }
    }
  }, [gameId]);

  // Make a player move - wrapped in useCallback to prevent dependency cycle
  const makePlayerMove = useCallback(async (column: number) => {
    if (!gameState || gameState.winner || gameState.isDraw || isPaused || gameState.currentPlayer !== 1 || isLoading) return

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Making move with game ID:', gameId)
      console.log('Current game state:', gameState)

      const response = await fetch('/api/game/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          column,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        // If game not found, try to initialize a new game and then make the move
        if (result.error === 'Game not found') {
          console.log('Game not found, initializing new game...');
          
          // Initialize a new game
          const initResponse = await fetch('/api/game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const initResult = await initResponse.json();
          
          if (!initResult.success) {
            throw new Error(initResult.error || 'Failed to initialize new game');
          }
          
          console.log('New game initialized:', initResult.data);
          
          // Update state with new game
          setGameState(initResult.data);
          const newGameId = initResult.data.id;
          setGameId(newGameId);
          
          // Explicitly update localStorage with new game ID
          try {
            localStorage.setItem("gameId", newGameId);
            console.log('Updated game ID in localStorage:', newGameId);
          } catch (err) {
            console.error('Failed to update game ID in localStorage:', err);
          }
          
          // Now make the move with the new game ID
          const newMoveResponse = await fetch('/api/game/move', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gameId: newGameId,
              column,
            }),
          });
          
          const newMoveResult = await newMoveResponse.json();
          
          if (!newMoveResult.success) {
            throw new Error(newMoveResult.error || 'Failed to make move with new game');
          }
          
          console.log('Move successful with new game:', newMoveResult.data);
          setGameState(newMoveResult.data);
          return;
        }
        
        // For other errors, throw as usual
        throw new Error(result.error || 'Failed to make move')
      }

      console.log('Move successful:', result.data)
      setGameState(result.data)

      // If it's now CPU's turn and game isn't over, we'll let the useEffect trigger the CPU move
    } catch (err) {
      console.error('Error making move:', err)
      setError('Failed to make move. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [gameState, isPaused, isLoading, gameId]);

  // Make a CPU move - wrapped in useCallback to prevent dependency cycle
  const makeCpuMove = useCallback(async () => {
    if (!gameState || gameState.winner || gameState.isDraw || isPaused || gameState.currentPlayer !== 2 || isLoading) return

    try {
      setIsLoading(true)
      setIsCpuThinking(true)
      setError(null)

      const response = await fetch('/api/game/cpu-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        // If game not found, try to initialize a new game
        if (result.error === 'Game not found') {
          console.log('Game not found for CPU move, initializing new game...');
          
          // Initialize a new game
          const initResponse = await fetch('/api/game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const initResult = await initResponse.json();
          
          if (!initResult.success) {
            throw new Error(initResult.error || 'Failed to initialize new game');
          }
          
          console.log('New game initialized for CPU:', initResult.data);
          
          // Update state with new game
          setGameState(initResult.data);
          const newGameId = initResult.data.id;
          setGameId(newGameId);
          
          // Explicitly update localStorage with new game ID
          try {
            localStorage.setItem("gameId", newGameId);
            console.log('Updated game ID in localStorage for CPU move:', newGameId);
          } catch (err) {
            console.error('Failed to update game ID in localStorage:', err);
          }
          
          return; // Don't proceed with CPU move since the new game starts with player 1
        }
        
        throw new Error(result.error || 'Failed to make CPU move')
      }

      setGameState(result.data)
    } catch (err) {
      console.error('Error making CPU move:', err)
      setError('Failed to make CPU move. Please try again.')
    } finally {
      setIsLoading(false)
      setIsCpuThinking(false)
    }
  }, [gameState, isPaused, isLoading, gameId, isCpuThinking]);

  // Turn timer countdown
  useEffect(() => {
    if (!gameState || !timerActive || isPaused || gameState.winner || gameState.isDraw || isCpuThinking) return

    const timer = setTimeout(() => {
      if (turnTimer > 0) {
        setTurnTimer((prev) => prev - 1)
      } else {
        // Auto-switch player 
        if (gameState.currentPlayer === 1) {
          makePlayerMove(hoverColumn || 0) // Make a move if timer runs out
        } else {
          makeCpuMove() // Trigger CPU move if it's CPU's turn
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [turnTimer, timerActive, isPaused, gameState, isCpuThinking, hoverColumn, makePlayerMove, makeCpuMove])

  // CPU player logic - trigger CPU move when it's their turn
  useEffect(() => {
    if (gameState && gameState.currentPlayer === 2 && !gameState.winner && !gameState.isDraw && !isPaused) {
      setIsCpuThinking(true)

      // Add a delay to make it seem like the CPU is thinking
      const cpuDelay = setTimeout(() => {
        makeCpuMove()
      }, 1500)

      return () => clearTimeout(cpuDelay)
    }
  }, [gameState, isPaused, makeCpuMove])

  // Function to fetch the state of an existing game
  const fetchGameState = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/game?gameId=${id}`)
      const result = await response.json()
      
      if (result.success) {
        console.log('Retrieved existing game:', result.data)
        setGameState(result.data)
      } else {
        console.log('Failed to retrieve game, initializing new one')
        // If we couldn't fetch the existing game, initialize a new one
        initializeGame()
      }
    } catch (err) {
      console.error('Error fetching game state:', err)
      // If error, initialize a new game
      initializeGame()
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize a new game
  const initializeGame = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize game')
      }

      console.log('Game initialized successfully:', result.data)
      console.log('Game ID:', result.data.id)
      
      // Save game ID to localStorage
      localStorage.setItem("gameId", result.data.id)
      
      setGameState(result.data)
      setGameId(result.data.id)
      setTimerActive(true)
      setIsPaused(false)
    } catch (err) {
      console.error('Error initializing game:', err)
      setError('Failed to initialize game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset the game
  const resetGame = async () => {
    if (!gameId) {
      // If no game exists, initialize a new one
      return initializeGame()
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/game/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        // If game not found, initialize a new game
        if (result.error === 'Game not found') {
          console.log('Game not found during reset, initializing new game...');
          return initializeGame();
        }
        
        throw new Error(result.error || 'Failed to reset game')
      }

      setGameState(result.data)
      setTimerActive(true)
      setIsPaused(false)
    } catch (err) {
      console.error('Error resetting game:', err)
      setError('Failed to reset game. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Start a completely new game, resetting everything
  const startNewGame = async () => {
    // Clear game ID from localStorage
    try {
      localStorage.removeItem("gameId");
      console.log('Game ID cleared from localStorage for new game');
    } catch (err) {
      console.error('Failed to clear game ID from localStorage:', err);
    }
    
    // Reset gameId state
    setGameId("");
    
    // Then initialize a new game
    await initializeGame();
  }

  const quitGame = () => {
    // Clear game ID from localStorage when quitting
    try {
      localStorage.removeItem("gameId");
      console.log('Game ID cleared from localStorage');
    } catch (err) {
      console.error('Failed to clear game ID from localStorage:', err);
    }
    
    router.push("/")
  }

  const getColumnTooltip = (col: number) => {
    if (!gameState || !gameState.board) return null

    // Find the lowest empty row in the column
    for (let row = 5; row >= 0; row--) {
      if (gameState.board[row][col] === null) {
        return row
      }
    }
    return null // Column is full
  }

  // Loading state
  if (isLoading && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-2xl font-bold text-white">Loading game...</div>
      </div>
    )
  }

  // Error state
  if (error && !gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-2xl font-bold text-red-500">{error}</div>
        <button 
          className="mt-4 bg-accent-red text-white px-6 py-2 rounded-full" 
          onClick={initializeGame}
        >
          Try Again
        </button>
      </div>
    )
  }

  // If game state is not loaded yet
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-2xl font-bold text-white">Initializing game...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {/* Header with logo and controls */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button
          className="bg-background text-white px-6 py-2 rounded-full border-2 border-white/20 font-bold"
          onClick={() => setIsPaused(true)}
        >
          MENU
        </button>

        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-full bg-accent-red"></div>
          <div className="w-8 h-8 rounded-full bg-accent-yellow"></div>
          <div className="w-8 h-8 rounded-full bg-accent-yellow"></div>
          <div className="w-8 h-8 rounded-full bg-accent-red"></div>
        </div>

        <button
          className="bg-background text-white px-6 py-2 rounded-full border-2 border-white/20 font-bold"
          onClick={resetGame}
        >
          RESTART
        </button>
      </div>

      <div className="flex items-start justify-center gap-8 w-full max-w-4xl">
        {/* Player 1 Score */}
        <div className="bg-primary rounded-lg shadow-game p-4 text-center w-32">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-accent-red flex items-center justify-center">
              <SmileIcon className="text-white" size={20} />
            </div>
          </div>
          <div className="font-bold text-sm truncate">{playerName}</div>
          <div className="text-4xl font-bold">{gameState.scores[1]}</div>
        </div>

        {/* Game Board */}
        <div className="relative">
          <div
            className="bg-primary rounded-lg p-4 grid grid-cols-7 gap-2 shadow-game border-4 border-black/10"
            onMouseLeave={() => setHoverColumn(null)}
          >
            {gameState.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                  onMouseEnter={() => {
                    if (!gameState.winner && !gameState.isDraw && !isPaused && gameState.currentPlayer === 1 && getColumnTooltip(colIndex) !== null) {
                      setHoverColumn(colIndex)
                    }
                  }}
                  onClick={() => gameState.currentPlayer === 1 && makePlayerMove(colIndex)}
                >
                  <div
                    className={`
                    absolute inset-0 rounded-full shadow-cell
                    ${cell === 1 ? "bg-accent-red" : cell === 2 ? "bg-accent-yellow" : "bg-empty"}
                    transition-colors duration-200 ease-in-out
                  `}
                  ></div>

                  {/* Hover indicator */}
                  {hoverColumn === colIndex && !cell && !gameState.winner && !gameState.isDraw && !isPaused && gameState.currentPlayer === 1 && (
                    <div className={`absolute inset-0 rounded-full border-4 border-white/30 pointer-events-none`}></div>
                  )}
                </div>
              )),
            )}
          </div>

          {/* Turn indicator */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div
              className={`
              bg-${gameState.currentPlayer === 1 ? "accent-red" : "accent-yellow"} 
              text-white px-6 py-3 rounded-lg shadow-game text-center min-w-[160px]
            `}
            >
              <div className="text-sm font-bold">
                {gameState.winner
                  ? gameState.winner === 1
                    ? `${playerName} WINS`
                    : "CPU WINS"
                  : gameState.isDraw
                    ? "DRAW"
                    : gameState.currentPlayer === 1
                      ? `${playerName}'S TURN`
                      : "CPU'S TURN"}
              </div>
              {!gameState.winner && !gameState.isDraw && (
                <div className="text-3xl font-bold">{isCpuThinking ? "..." : `${turnTimer}s`}</div>
              )}
            </div>
          </div>
        </div>

        {/* CPU Score */}
        <div className="bg-primary rounded-lg shadow-game p-4 text-center w-32">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-accent-yellow flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
          </div>
          <div className="font-bold text-sm">CPU</div>
          <div className="text-4xl font-bold">{gameState.scores[2]}</div>
        </div>
      </div>

      {/* Display any errors as a toast/notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}

      {/* Pause Menu */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background text-white p-8 rounded-lg shadow-lg w-80 text-center">
            <h2 className="text-4xl font-bold mb-8">PAUSE</h2>
            <div className="space-y-4">
              <button
                className="w-full bg-white text-black py-3 rounded-lg font-bold shadow-game"
                onClick={() => setIsPaused(false)}
              >
                CONTINUE GAME
              </button>
              <button
                className="w-full bg-white text-black py-3 rounded-lg font-bold shadow-game"
                onClick={() => {
                  resetGame()
                  setIsPaused(false)
                }}
              >
                RESTART
              </button>
              <button
                className="w-full bg-white text-black py-3 rounded-lg font-bold shadow-game"
                onClick={() => {
                  startNewGame()
                  setIsPaused(false)
                }}
              >
                NEW GAME
              </button>
              <button
                className="w-full bg-accent-red text-white py-3 rounded-lg font-bold shadow-game"
                onClick={quitGame}
              >
                QUIT GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Announcement */}
      {gameState.winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary text-black p-8 rounded-lg shadow-lg w-80 text-center">
            <div className="text-4xl font-bold mb-4">{gameState.winner === 1 ? playerName : "CPU"}</div>
            <div className="text-6xl font-bold mb-8">WINS</div>
            <div className="flex flex-col gap-4">
              <button className="bg-background text-white px-8 py-3 rounded-full font-bold" onClick={resetGame}>
                PLAY AGAIN
              </button>
              <button className="bg-accent-red text-white px-8 py-3 rounded-full font-bold" onClick={quitGame}>
                BACK TO HOME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


