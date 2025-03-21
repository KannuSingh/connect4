import { describe, it, expect, beforeEach } from 'vitest'
import { 
  createEmptyBoard, 
  initializeGameState, 
  isValidMove, 
  makeMove,
  checkWin,
  checkDraw,
  getCpuMove,
  resetGame,
  getGameState,
  saveGameState,
  GameState,
  Player
} from '@/lib/game-engine'

describe('Game Engine', () => {
  const gameId = 'test-game-id'
  let gameState: GameState

  beforeEach(() => {
    gameState = initializeGameState(gameId)
  })

  describe('createEmptyBoard', () => {
    it('should create a 6x7 empty board', () => {
      const board = createEmptyBoard()
      expect(board.length).toBe(6)
      expect(board[0].length).toBe(7)
      
      // Check that all cells are null
      board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeNull()
        })
      })
    })
  })

  describe('initializeGameState', () => {
    it('should initialize a new game state with the given ID', () => {
      const state = initializeGameState('test-id')
      
      expect(state.id).toBe('test-id')
      expect(state.currentPlayer).toBe(1)
      expect(state.winner).toBeNull()
      expect(state.isDraw).toBe(false)
      expect(state.scores).toEqual({ 1: 0, 2: 0 })
      expect(state.board).toEqual(createEmptyBoard())
    })
  })

  describe('isValidMove', () => {
    it('should return true for a valid move', () => {
      expect(isValidMove(gameState, 3)).toBe(true)
    })

    it('should return false for a column out of bounds', () => {
      expect(isValidMove(gameState, -1)).toBe(false)
      expect(isValidMove(gameState, 7)).toBe(false)
    })

    it('should return false when the game is over', () => {
      const winState = { ...gameState, winner: 1 as Player }
      const drawState = { ...gameState, isDraw: true }
      
      expect(isValidMove(winState, 3)).toBe(false)
      expect(isValidMove(drawState, 3)).toBe(false)
    })

    it('should return false when the column is full', () => {
      // Fill column 2
      const state = { ...gameState }
      for (let i = 0; i < 6; i++) {
        const player = i % 2 === 0 ? 1 : 2 as Player
        state.board[i][2] = player
      }
      
      expect(isValidMove(state, 2)).toBe(false)
    })

    it('should return false if game already has a winner', () => {
      const winState = { ...gameState, winner: 1 as Player }
      expect(isValidMove(winState, 3)).toBe(false)
    })
  })

  describe('makeMove', () => {
    it('should place a piece at the correct position', () => {
      const newState = makeMove(gameState, 3)
      
      // Piece should be at the bottom row of column 3
      expect(newState.board[5][3]).toBe(1)
    })

    it('should switch players after a move', () => {
      const newState = makeMove(gameState, 3)
      expect(newState.currentPlayer).toBe(2)
      
      // Make another move
      const newerState = makeMove(newState, 4)
      expect(newerState.currentPlayer).toBe(1)
    })

    it('should throw an error for an invalid move', () => {
      // Fill column 2
      for (let i = 0; i < 6; i++) {
        gameState.board[i][2] = i % 2 === 0 ? 1 : 2 as Player
      }
      
      expect(() => makeMove(gameState, 2)).toThrow('Invalid move')
    })

    it('should stack pieces correctly in a column', () => {
      // Make two moves in the same column
      let state = makeMove(gameState, 3)
      state = makeMove(state, 3)
      
      expect(state.board[5][3]).toBe(1) // Bottom piece
      expect(state.board[4][3]).toBe(2) // Piece above
    })
  })

  describe('checkWin', () => {
    it('should detect a horizontal win', () => {
      // Create a horizontal line of 4 for player 1
      for (let col = 0; col < 4; col++) {
        gameState.board[5][col] = 1
      }
      
      expect(checkWin(gameState.board, 5, 3, 1)).toBe(true)
    })

    it('should detect a vertical win', () => {
      // Create a vertical line of 4 for player 2
      for (let row = 5; row > 1; row--) {
        gameState.board[row][3] = 2
      }
      
      expect(checkWin(gameState.board, 2, 3, 2)).toBe(true)
    })

    it('should detect a diagonal down-right win', () => {
      // Create a diagonal down-right line for player 1
      for (let i = 0; i < 4; i++) {
        gameState.board[2 + i][1 + i] = 1
      }
      
      expect(checkWin(gameState.board, 5, 4, 1)).toBe(true)
    })

    it('should detect a diagonal down-left win', () => {
      // Create a diagonal down-left line for player 2
      for (let i = 0; i < 4; i++) {
        gameState.board[2 + i][5 - i] = 2
      }
      
      expect(checkWin(gameState.board, 5, 2, 2)).toBe(true)
    })

    it('should return false when there is no win', () => {
      // Random scattered pieces
      gameState.board[5][1] = 1
      gameState.board[5][3] = 1
      gameState.board[5][5] = 1
      gameState.board[4][2] = 2
      gameState.board[4][4] = 2
      
      expect(checkWin(gameState.board, 5, 5, 1)).toBe(false)
    })
  })

  describe('checkDraw', () => {
    it('should detect a draw when board is full', () => {
      // Fill the board without a win
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          gameState.board[row][col] = (row + col) % 2 === 0 ? 1 : 2 as Player
        }
      }
      
      expect(checkDraw(gameState.board)).toBe(true)
    })

    it('should return false when board is not full', () => {
      // Fill most of the board but leave some empty spaces
      for (let row = 1; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          gameState.board[row][col] = (row + col) % 2 === 0 ? 1 : 2 as Player
        }
      }
      // Top row still has nulls
      
      expect(checkDraw(gameState.board)).toBe(false)
    })
  })

  describe('getCpuMove', () => {
    it('should return a valid column index', () => {
      const column = getCpuMove(gameState)
      expect(column).toBeGreaterThanOrEqual(0)
      expect(column).toBeLessThan(7)
    })

    it('should return null when game is already won', () => {
      const winState = { ...gameState, winner: 1 as Player }
      expect(getCpuMove(winState)).toBeNull()
    })

    it('should return null when game is a draw', () => {
      const drawState = { ...gameState, isDraw: true }
      expect(getCpuMove(drawState)).toBeNull()
    })

    it('should return null when no valid moves are available', () => {
      // Fill the entire board
      const fullBoard = gameState
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          fullBoard.board[row][col] = (row + col) % 2 === 0 ? 1 : 2 as Player
        }
      }
      
      expect(getCpuMove(fullBoard)).toBeNull()
    })
  })

  describe('resetGame', () => {
    it('should reset the board and game status but keep scores', () => {
      // Set up a game with scores, a winner, and filled board
      gameState.winner = 1 as Player
      gameState.isDraw = false
      gameState.scores = { 1: 3, 2: 2 }
      gameState.board[5][3] = 1
      
      const resetState = resetGame(gameState)
      
      // Board should be reset
      expect(resetState.board).toEqual(createEmptyBoard())
      
      // Game status should be reset
      expect(resetState.winner).toBeNull()
      expect(resetState.isDraw).toBe(false)
      expect(resetState.currentPlayer).toBe(1)
      
      // Scores should be preserved
      expect(resetState.scores).toEqual({ 1: 3, 2: 2 })
      
      // ID should be preserved
      expect(resetState.id).toBe(gameId)
    })
  })

  describe('getGameState and saveGameState', () => {
    it('should save and retrieve a game state', () => {
      saveGameState(gameState)
      
      const retrievedState = getGameState(gameId)
      expect(retrievedState).toEqual(gameState)
    })

    it('should return null for a non-existent game', () => {
      const nonExistentState = getGameState('non-existent-id')
      expect(nonExistentState).toBeNull()
    })
  })
}) 