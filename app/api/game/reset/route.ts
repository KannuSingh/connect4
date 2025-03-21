import { NextRequest, NextResponse } from 'next/server';
import { getGameState, resetGame, saveGameState } from '@/lib/game-engine';

// Reset a game
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { gameId } = body;
    
    // Validate game ID
    if (!gameId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Get the game state
    const gameState = getGameState(gameId);
    
    if (!gameState) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game not found' 
        },
        { status: 404 }
      );
    }
    
    // Reset the game
    const updatedGameState = resetGame(gameState);
    
    // Save the updated game state
    saveGameState(updatedGameState);
    
    // Return the updated game state
    return NextResponse.json({
      success: true,
      data: updatedGameState
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while resetting the game'
    }, { status: 500 });
  }
} 