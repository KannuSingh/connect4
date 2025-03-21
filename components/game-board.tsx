"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SmileIcon, Bot } from "lucide-react"

type Player = 1 | 2
type Cell = Player | null
type Board = Cell[][]

const ROWS = 6
const COLS = 7

const createEmptyBoard = (): Board => {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null))
}

export default function GameBoard() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState<string>("Player 1")
  const [board, setBoard] = useState<Board>(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [winner, setWinner] = useState<Player | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)
  const [scores, setScores] = useState({ 1: 0, 2: 0 })
  const [isPaused, setIsPaused] = useState(false)
  const [turnTimer, setTurnTimer] = useState(10)
  const [timerActive, setTimerActive] = useState(true)
  const [isCpuThinking, setIsCpuThinking] = useState(false)

  // Load player name on mount
  useEffect(() => {
    const storedName = localStorage.getItem("playerName")
    if (storedName) {
      setPlayerName(storedName)
    }
  }, [])

  // Reset turn timer when player changes
  useEffect(() => {
    setTurnTimer(10)
  }, [currentPlayer])

  // Turn timer countdown
  useEffect(() => {
    if (!timerActive || isPaused || winner || isDraw || isCpuThinking) return

    const timer = setTimeout(() => {
      if (turnTimer > 0) {
        setTurnTimer((prev) => prev - 1)
      } else {
        // Auto-switch player when time runs out
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [turnTimer, timerActive, isPaused, winner, isDraw, currentPlayer, isCpuThinking])

  // Win detection
  const checkWin = useCallback((board: Board, row: number, col: number): boolean => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal down-right
      [1, -1], // diagonal down-left
    ]

    const player = board[row][col]

    for (const [dx, dy] of directions) {
      let count = 1

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + i * dx
        const newCol = col + i * dy

        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          count++
        } else {
          break
        }
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - i * dx
        const newCol = col - i * dy

        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          count++
        } else {
          break
        }
      }

      if (count >= 4) return true
    }

    return false
  }, [])

  // Draw detection
  const checkDraw = useCallback((board: Board): boolean => {
    return board[0].every((cell) => cell !== null)
  }, [])

  const dropPiece = useCallback((col: number) => {
    // Early return conditions - prevent moves when game is over or paused
    if (winner || isDraw || isPaused) return
    
    // For player 2 (CPU), only allow moves when CPU is thinking
    if (currentPlayer === 2 && !isCpuThinking) return

    const newBoard = [...board]

    // Find the lowest empty row in the selected column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = currentPlayer
        setBoard(newBoard)

        // Check for win or draw
        if (checkWin(newBoard, row, col)) {
          setWinner(currentPlayer)
          setScores((prev) => ({
            ...prev,
            [currentPlayer]: prev[currentPlayer] + 1,
          }))
          setTimerActive(false)
        } else if (checkDraw(newBoard)) {
          setIsDraw(true)
          setTimerActive(false)
        } else {
          // Switch player
          setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
        }

        break
      }
    }
  }, [board, currentPlayer, isDraw, isPaused, isCpuThinking, winner, checkWin, checkDraw])

  const makeCpuMove = useCallback(() => {
    // Simple CPU strategy: find valid columns and pick one randomly
    const validColumns = []

    for (let col = 0; col < COLS; col++) {
      if (board[0][col] === null) {
        validColumns.push(col)
      }
    }

    if (validColumns.length > 0) {
      const randomCol = validColumns[Math.floor(Math.random() * validColumns.length)]
      dropPiece(randomCol)
    }
  }, [board, dropPiece])

  // CPU player logic
  useEffect(() => {
    // Only proceed if it's CPU's turn and the game is active
    if (currentPlayer === 2 && !winner && !isDraw && !isPaused) {
      console.log("CPU's turn - thinking...")
      
      // Set thinking state to true
      setIsCpuThinking(true)

      // Add a small delay to make it seem like the CPU is thinking
      const cpuDelay = setTimeout(() => {
        // Find valid columns for CPU move
        const validColumns = []
        for (let col = 0; col < COLS; col++) {
          if (board[0][col] === null) {
            validColumns.push(col)
          }
        }

        // Make the move if there are valid columns
        if (validColumns.length > 0) {
          // Choose a random column
          const randomCol = validColumns[Math.floor(Math.random() * validColumns.length)]
          // Make the move directly here instead of calling another function
          for (let row = ROWS - 1; row >= 0; row--) {
            const newBoard = [...board]
            if (newBoard[row][randomCol] === null) {
              newBoard[row][randomCol] = 2 // CPU is player 2
              setBoard(newBoard)
              
              // Check for win or draw
              if (checkWin(newBoard, row, randomCol)) {
                setWinner(2)
                setScores(prev => ({ ...prev, 2: prev[2] + 1 }))
                setTimerActive(false)
              } else if (checkDraw(newBoard)) {
                setIsDraw(true)
                setTimerActive(false)
              } else {
                // Switch back to player 1
                setCurrentPlayer(1)
              }
              
              break
            }
          }
        }
        
        // CPU finished thinking
        setIsCpuThinking(false)
      }, 1500)

      // Cleanup function
      return () => clearTimeout(cpuDelay)
    }
  }, [currentPlayer, winner, isDraw, isPaused, board, checkWin, checkDraw])

  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPlayer(1)
    setWinner(null)
    setIsDraw(false)
    setTimerActive(true)
    setTurnTimer(10)
    setIsPaused(false)
  }

  const quitGame = () => {
    router.push("/")
  }

  const getColumnTooltip = (col: number) => {
    // Find the lowest empty row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        return row
      }
    }
    return null // Column is full
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
          <div className="text-4xl font-bold">{scores[1]}</div>
        </div>

        {/* Game Board */}
        <div className="relative">
          <div
            className="bg-primary rounded-lg p-4 grid grid-cols-7 gap-2 shadow-game border-4 border-black/10"
            onMouseLeave={() => setHoverColumn(null)}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                  onMouseEnter={() => {
                    if (!winner && !isDraw && !isPaused && currentPlayer === 1 && getColumnTooltip(colIndex) !== null) {
                      setHoverColumn(colIndex)
                    }
                  }}
                  onClick={() => currentPlayer === 1 && dropPiece(colIndex)}
                >
                  <div
                    className={`
                    absolute inset-0 rounded-full shadow-cell
                    ${cell === 1 ? "bg-accent-red" : cell === 2 ? "bg-accent-yellow" : "bg-empty"}
                    transition-colors duration-200 ease-in-out
                  `}
                  ></div>

                  {/* Hover indicator */}
                  {hoverColumn === colIndex && !cell && !winner && !isDraw && !isPaused && currentPlayer === 1 && (
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
              bg-${currentPlayer === 1 ? "accent-red" : "accent-yellow"} 
              text-white px-6 py-3 rounded-lg shadow-game text-center min-w-[160px]
            `}
            >
              <div className="text-sm font-bold">
                {winner
                  ? winner === 1
                    ? `${playerName} WINS`
                    : "CPU WINS"
                  : isDraw
                    ? "DRAW"
                    : currentPlayer === 1
                      ? `${playerName}'S TURN`
                      : "CPU'S TURN"}
              </div>
              {!winner && !isDraw && (
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
          <div className="text-4xl font-bold">{scores[2]}</div>
        </div>
      </div>

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
      {winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary text-black p-8 rounded-lg shadow-lg w-80 text-center">
            <div className="text-4xl font-bold mb-4">{winner === 1 ? playerName : "CPU"}</div>
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

