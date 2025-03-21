/**
 * Connect 4 Game Engine
 * Server-side implementation of the game logic
 */

export type Player = 1 | 2
export type Cell = Player | null
export type Board = Cell[][]

// Game state interface
export interface GameState {
  id: string;
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  scores: { 1: number; 2: number };
  lastMove?: { row: number; col: number };
  createdAt: Date;
  updatedAt: Date;
}

// Constants
export const ROWS = 6;
export const COLS = 7;
export const WIN_COUNT = 4;

// Create an empty game board
export function createEmptyBoard(): Board {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null));
}

// Initialize a new game state
export function initializeGameState(gameId: string): GameState {
  const now = new Date();
  return {
    id: gameId,
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    scores: { 1: 0, 2: 0 },
    createdAt: now,
    updatedAt: now
  };
}

// Check if a move is valid
export function isValidMove(gameState: GameState, column: number): boolean {
  if (column < 0 || column >= COLS) return false;
  if (gameState.winner || gameState.isDraw) return false;
  
  // Check if the column is full
  return gameState.board[0][column] === null;
}

// Make a move and return the updated game state
export function makeMove(gameState: GameState, column: number): GameState {
  if (!isValidMove(gameState, column)) {
    throw new Error('Invalid move');
  }

  // Create a new game state to avoid mutating the original
  const newGameState = { ...gameState, board: [...gameState.board.map(row => [...row])] };
  const { board, currentPlayer } = newGameState;
  
  // Find the lowest empty row in the selected column
  let rowPosition = -1;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      board[row][column] = currentPlayer;
      rowPosition = row;
      break;
    }
  }
  
  if (rowPosition === -1) {
    throw new Error('Column is full');
  }
  
  // Check for a win
  if (checkWin(board, rowPosition, column, currentPlayer)) {
    newGameState.winner = currentPlayer;
    newGameState.scores[currentPlayer] += 1;
  } 
  // Check for a draw if no winner
  else if (checkDraw(board)) {
    newGameState.isDraw = true;
  } 
  // Switch players if game continues
  else {
    newGameState.currentPlayer = currentPlayer === 1 ? 2 : 1;
  }
  
  return newGameState;
}

// Check for a win condition
export function checkWin(board: Board, row: number, col: number, player: Player): boolean {
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // Check in positive direction
    for (let i = 1; i < WIN_COUNT; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;

      if (
        newRow >= 0 && 
        newRow < ROWS && 
        newCol >= 0 && 
        newCol < COLS && 
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // Check in negative direction
    for (let i = 1; i < WIN_COUNT; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;

      if (
        newRow >= 0 && 
        newRow < ROWS && 
        newCol >= 0 && 
        newCol < COLS && 
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= WIN_COUNT) return true;
  }

  return false;
}

// Check for a draw condition
export function checkDraw(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

// Get CPU move
export function getCpuMove(gameState: GameState): number | null {
  if (gameState.winner || gameState.isDraw) {
    return null;
  }
  
  const validColumns = [];
  
  // Collect all valid columns
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(gameState, col)) {
      validColumns.push(col);
    }
  }
  
  if (validColumns.length === 0) {
    return null;
  }
  
  // For now, just pick a random column
  // This could be enhanced with better AI strategies
  return validColumns[Math.floor(Math.random() * validColumns.length)];
}

// Reset the game board but keep the scores
export function resetGame(gameState: GameState): GameState {
  return {
    ...gameState,
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    isDraw: false,
    lastMove: undefined,
    updatedAt: new Date()
  };
}

// In-memory store for game states (in a real application, this would be in a database)
// This is just for demonstration purposes
const gameStore: Record<string, GameState> = {};

export function getGameState(gameId: string): GameState | null {
  return gameStore[gameId] || null;
}

export function saveGameState(gameState: GameState): void {
  gameStore[gameState.id] = gameState;
} 