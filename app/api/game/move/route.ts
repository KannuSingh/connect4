import { NextRequest, NextResponse } from 'next/server';
import { getGameState, makeMove, saveGameState } from '@/lib/game-engine';

// Process player move
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { gameId, column } = body;
    
    // Validate inputs
    if (!gameId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game ID is required' 
        },
        { status: 400 }
      );
    }
    
    if (typeof column !== 'number' || column < 0 || column > 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Column must be a number between 0 and 6' 
        },
        { status: 400 }
      );
    }
    
    // Get the current game state
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
    
    // Ensure it's the player's turn (player 1)
    if (gameState.currentPlayer !== 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not player\'s turn' 
        },
        { status: 400 }
      );
    }
    
    // Make the move
    const updatedGameState = makeMove(gameState, column);
    
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
      error: error instanceof Error ? error.message : 'An error occurred processing the move'
    }, { status: 500 });
  }
} 