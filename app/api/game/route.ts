import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { initializeGameState, getGameState, saveGameState } from '@/lib/game-engine';

/**
 * POST /api/game - Create a new game
 */
export async function POST() {
  try {
    // Generate a unique game ID
    const gameId = uuidv4();
    
    // Initialize a new game state
    const gameState = initializeGameState(gameId);
    
    // Save the game state
    saveGameState(gameState);
    
    // Return the new game state
    return NextResponse.json({
      success: true,
      data: gameState
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create a new game'
    }, { status: 500 });
  }
}

/**
 * GET /api/game - Get the current game state
 */
export async function GET(request: NextRequest) {
  // Get the game ID from the URL
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  
  // Validate game ID
  if (!gameId) {
    return NextResponse.json({
      success: false,
      error: 'Game ID is required'
    }, { status: 400 });
  }
  
  try {
    // Get the game state
    const gameState = getGameState(gameId);
    
    // Check if the game exists
    if (!gameState) {
      return NextResponse.json({
        success: false,
        error: 'Game not found'
      }, { status: 404 });
    }
    
    // Return the game state
    return NextResponse.json({
      success: true,
      data: gameState
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve the game'
    }, { status: 500 });
  }
} 