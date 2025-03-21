#!/bin/bash

# Test script for Connect4 API endpoints

echo "# Testing Connect4 API endpoints"
echo

# Initialize a new game
echo "## Initializing a new game"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/game)
echo "$RESPONSE" | json_pp

# Extract game ID
GAME_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo
echo "Game ID: $GAME_ID"
echo

# Make a player move (column 3)
echo "## Making player move (column 3)"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/game/move \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\",\"column\":3}")
echo "$RESPONSE" | json_pp
echo

# Make a CPU move
echo "## Making CPU move"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/game/cpu-move \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\"}")
echo "$RESPONSE" | json_pp
echo

# Reset the game
echo "## Resetting the game"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/game/reset \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\"}")
echo "$RESPONSE" | json_pp
echo

# Get game state
echo "## Getting game state"
RESPONSE=$(curl -s -X GET "http://localhost:3000/api/game?gameId=$GAME_ID")
echo "$RESPONSE" | json_pp
echo

echo "Done!" 