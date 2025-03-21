import { NextRequest, NextResponse } from 'next/server';
import { getGameState, getCpuMove, makeMove, saveGameState } from '@/lib/game-engine';

// Process CPU move
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
    
    // Ensure it's the CPU's turn (player 2)
    if (gameState.currentPlayer !== 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not CPU\'s turn' 
        },
        { status: 400 }
      );
    }
    
    // If the game is already over, just return the current state
    if (gameState.winner || gameState.isDraw) {
      return NextResponse.json({
        success: true,
        data: gameState
      });
    }
    
    // Get the CPU's move (column)
    const cpuColumn = getCpuMove(gameState);
    
    // Handle case where CPU can't make a valid move
    if (cpuColumn === null) {
      return NextResponse.json({
        success: false,
        error: 'No valid moves available'
      }, { status: 400 });
    }
    
    // Make the move and save the updated state
    const updatedGameState = makeMove(gameState, cpuColumn);
    saveGameState(updatedGameState);
    
    // Return the updated game state
    return NextResponse.json({
      success: true,
      data: updatedGameState
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while making CPU move'
    }, { status: 500 });
  }
} 