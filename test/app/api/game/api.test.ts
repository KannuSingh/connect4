import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createGame, GET as getGame } from '@/app/api/game/route'
import { POST as makePlayerMove } from '@/app/api/game/move/route'
import { POST as makeCpuMove } from '@/app/api/game/cpu-move/route'
import { POST as resetGameRoute } from '@/app/api/game/reset/route'
import * as gameEngine from '@/lib/game-engine'
import { Player } from '@/lib/game-engine'

// Mock the game engine module
vi.mock('@/lib/game-engine', async () => {
  const actual = await vi.importActual('@/lib/game-engine')
  return {
    ...actual,
    initializeGameState: vi.fn(),
    getGameState: vi.fn(),
    saveGameState: vi.fn(),
    makeMove: vi.fn(),
    getCpuMove: vi.fn(),
    resetGame: vi.fn(),
  }
})

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}))

// Helper function to compare objects ignoring date formats
const expectResponseToMatch = (actual: any, expected: any) => {
  const { data: actualData, ...actualRest } = actual;
  const { data: expectedData, ...expectedRest } = expected;
  
  // Compare non-data parts directly
  expect(actualRest).toEqual(expectedRest);
  
  // For data object, compare each property individually, handling dates specially
  const { createdAt: actualCreatedAt, updatedAt: actualUpdatedAt, ...actualDataRest } = actualData;
  const { createdAt: expectedCreatedAt, updatedAt: expectedUpdatedAt, ...expectedDataRest } = expectedData;
  
  // Compare non-date properties
  expect(actualDataRest).toEqual(expectedDataRest);
  
  // Verify dates exist (but don't check exact format)
  expect(actualCreatedAt).toBeDefined();
  expect(actualUpdatedAt).toBeDefined();
}

describe('API Routes', () => {
  const mockGameState = {
    id: 'test-game-id',
    board: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 1 as Player,
    winner: null,
    isDraw: false,
    scores: { 1: 0, 2: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUpdatedGameState = {
    ...mockGameState,
    board: [...mockGameState.board],
    currentPlayer: 2 as Player,
    updatedAt: new Date(),
  }

  const mockGameStateWithWinner = {
    ...mockGameState,
    currentPlayer: 2 as Player,
    winner: 1 as Player,
  }

  const createMockRequest = (body = {}) => {
    return new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  const createMockGetRequest = (params = {}) => {
    const url = new URL('http://localhost:3000/api/test')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value as string)
    })
    return new NextRequest(url)
  }

  beforeEach(() => {
    vi.resetAllMocks()

    // Default mock implementations
    vi.mocked(gameEngine.initializeGameState).mockReturnValue(mockGameState)
    vi.mocked(gameEngine.getGameState).mockReturnValue(mockGameState)
    vi.mocked(gameEngine.makeMove).mockReturnValue(mockUpdatedGameState)
    vi.mocked(gameEngine.getCpuMove).mockReturnValue(3)
    vi.mocked(gameEngine.resetGame).mockReturnValue(mockGameState)
  })

  describe('POST /api/game - Create Game', () => {
    it('should create a new game and return it', async () => {
      const request = createMockRequest()
      const response = await createGame()
      const data = await response.json()

      expect(gameEngine.initializeGameState).toHaveBeenCalledWith('mock-uuid')
      expect(gameEngine.saveGameState).toHaveBeenCalledWith(mockGameState)
      
      expectResponseToMatch(data, {
        success: true,
        data: mockGameState,
      })
    })

    it('should handle errors', async () => {
      vi.mocked(gameEngine.initializeGameState).mockImplementation(() => {
        throw new Error('Test error')
      })

      const request = createMockRequest()
      const response = await createGame()
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Test error',
      })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/game - Get Game', () => {
    it('should return a game state by ID', async () => {
      const request = createMockGetRequest({ gameId: 'test-game-id' })
      const response = await getGame(request)
      const data = await response.json()

      expect(gameEngine.getGameState).toHaveBeenCalledWith('test-game-id')
      
      expectResponseToMatch(data, {
        success: true,
        data: mockGameState,
      })
    })

    it('should return an error if gameId is missing', async () => {
      const request = createMockGetRequest()
      const response = await getGame(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game ID is required',
      })
      expect(response.status).toBe(400)
    })

    it('should return an error if game is not found', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue(null)

      const request = createMockGetRequest({ gameId: 'non-existent' })
      const response = await getGame(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game not found',
      })
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/game/move - Player Move', () => {
    it('should make a player move and return updated state', async () => {
      const request = createMockRequest({
        gameId: 'test-game-id',
        column: 3,
      })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(gameEngine.getGameState).toHaveBeenCalledWith('test-game-id')
      expect(gameEngine.makeMove).toHaveBeenCalledWith(mockGameState, 3)
      expect(gameEngine.saveGameState).toHaveBeenCalledWith(mockUpdatedGameState)
      
      expectResponseToMatch(data, {
        success: true,
        data: mockUpdatedGameState,
      })
    })

    it('should return an error if gameId is missing', async () => {
      const request = createMockRequest({ column: 3 })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game ID is required',
      })
      expect(response.status).toBe(400)
    })

    it('should return an error if column is invalid', async () => {
      const request = createMockRequest({
        gameId: 'test-game-id',
        column: 'invalid',
      })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Column must be a number between 0 and 6',
      })
      expect(response.status).toBe(400)
    })

    it('should return an error if game is not found', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue(null)

      const request = createMockRequest({
        gameId: 'non-existent',
        column: 3,
      })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game not found',
      })
      expect(response.status).toBe(404)
    })

    it('should return an error if it is not player\'s turn', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue({
        ...mockGameState,
        currentPlayer: 2 as Player,
      })

      const request = createMockRequest({
        gameId: 'test-game-id',
        column: 3,
      })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Not player\'s turn',
      })
      expect(response.status).toBe(400)
    })

    it('should handle errors from makeMove', async () => {
      vi.mocked(gameEngine.makeMove).mockImplementation(() => {
        throw new Error('Invalid move')
      })

      const request = createMockRequest({
        gameId: 'test-game-id',
        column: 3,
      })
      const response = await makePlayerMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Invalid move',
      })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/game/cpu-move - CPU Move', () => {
    it('should make a CPU move and return updated state', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue({
        ...mockGameState,
        currentPlayer: 2 as Player,
      });

      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(gameEngine.getGameState).toHaveBeenCalledWith('test-game-id')
      expect(gameEngine.getCpuMove).toHaveBeenCalledWith({
        ...mockGameState,
        currentPlayer: 2 as Player,
      })
      expect(gameEngine.makeMove).toHaveBeenCalledWith({
        ...mockGameState,
        currentPlayer: 2 as Player,
      }, 3)
      expect(gameEngine.saveGameState).toHaveBeenCalledWith(mockUpdatedGameState)
      
      expectResponseToMatch(data, {
        success: true,
        data: mockUpdatedGameState,
      })
    })

    it('should return an error if gameId is missing', async () => {
      const request = createMockRequest({})
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game ID is required',
      })
      expect(response.status).toBe(400)
    })

    it('should return an error if game is not found', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue(null)

      const request = createMockRequest({
        gameId: 'non-existent',
      })
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game not found',
      })
      expect(response.status).toBe(404)
    })

    it('should return an error if it is not CPU\'s turn', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue({
        ...mockGameState,
        currentPlayer: 1 as Player,
      })

      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Not CPU\'s turn',
      })
      expect(response.status).toBe(400)
    })

    it('should return current state if game is already over', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue(mockGameStateWithWinner)

      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(gameEngine.getCpuMove).not.toHaveBeenCalled()
      expect(gameEngine.makeMove).not.toHaveBeenCalled()
      
      expectResponseToMatch(data, {
        success: true,
        data: mockGameStateWithWinner,
      })
    })

    it('should return an error if no valid CPU move is available', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue({
        ...mockGameState,
        currentPlayer: 2 as Player,
      });
      
      vi.mocked(gameEngine.getCpuMove).mockReturnValue(null)

      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await makeCpuMove(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'No valid moves available',
      })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/game/reset - Reset Game', () => {
    it('should reset the game and return updated state', async () => {
      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await resetGameRoute(request)
      const data = await response.json()

      expect(gameEngine.getGameState).toHaveBeenCalledWith('test-game-id')
      expect(gameEngine.resetGame).toHaveBeenCalledWith(mockGameState)
      expect(gameEngine.saveGameState).toHaveBeenCalledWith(mockGameState)
      
      expectResponseToMatch(data, {
        success: true,
        data: mockGameState,
      })
    })

    it('should return an error if gameId is missing', async () => {
      const request = createMockRequest({})
      const response = await resetGameRoute(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game ID is required',
      })
      expect(response.status).toBe(400)
    })

    it('should return an error if game is not found', async () => {
      vi.mocked(gameEngine.getGameState).mockReturnValue(null)

      const request = createMockRequest({
        gameId: 'non-existent',
      })
      const response = await resetGameRoute(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Game not found',
      })
      expect(response.status).toBe(404)
    })

    it('should handle errors from resetGame', async () => {
      vi.mocked(gameEngine.resetGame).mockImplementation(() => {
        throw new Error('Reset failed')
      })

      const request = createMockRequest({
        gameId: 'test-game-id',
      })
      const response = await resetGameRoute(request)
      const data = await response.json()

      expect(data).toEqual({
        success: false,
        error: 'Reset failed',
      })
      expect(response.status).toBe(500)
    })
  })
}) 