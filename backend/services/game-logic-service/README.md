# Game Logic Service

## Overview

The Game Logic Service is the core component of the 8192 game engine, responsible for managing game sessions, processing player actions, and coordinating with other services to maintain game state. This service implements the turn-based gameplay mechanics and ensures fair, consistent game progression.

## Key Features

- Turn-based gameplay management
- Action processing and validation
- Game state persistence
- Player resource management
- Integration with AI opponent system

## Architecture

The service is built using a modular architecture with the following key components:

### GameService
The main entry point for the service, coordinating all game-related operations.

### GameCycleManager
Manages the progression of game cycles, ensuring proper timing and synchronization.

### GameActionRegistry
Maintains a registry of all possible game actions and their handlers.

### Action Handlers
Individual handlers for different types of game actions (resource collection, combat, etc.).

## Game Cycle Details

Each game operates on a cycle-based system:
- Total cycles per game: 8,192
- Cycle duration: 73.828 seconds
- Total game duration: 7 days

Player turns are managed with the following constraints:
- Daily turn allocation: 50 turns
- Maximum stored turns: 75 turns
- Turns reset at midnight server time

## State Management

The service uses a dual-database approach for state management:
- MongoDB: Long-term state storage and game history
- Redis: Real-time game state and cycle management

## API Endpoints

### Game Management
- POST /games/start - Start a new game session
- GET /games/:id - Get game state
- POST /games/:id/action - Submit a game action

### Player Actions
- POST /games/:id/players/:playerId/turns - Submit turn actions
- GET /games/:id/players/:playerId/state - Get player state

## Environment Variables

\`\`\`
MONGODB_URI=mongodb://localhost:27017/game-logic
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
\`\`\`

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Start the service:
   \`\`\`bash
   npm run dev
   \`\`\`

## Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

## Development

### Code Structure

- src/
  - core/ - Core game mechanics
  - types/ - TypeScript type definitions
  - actions/ - Action handlers
  - ai/ - AI integration
  - player/ - Player management
  - world/ - World state management
  - __tests__/ - Test files

### Adding New Actions

1. Create a new action handler in src/core/actions/
2. Implement the GameActionHandler interface
3. Register the handler in GameActionRegistry
4. Add tests for the new action

### Adding New Game Features

1. Update GameConfig.ts with any new configuration values
2. Add new types to GameState.ts if needed
3. Implement new action handlers if required
4. Update tests to cover new functionality

## Contributing

1. Create a feature branch
2. Implement changes with tests
3. Submit a pull request with a clear description

## License

This service is part of the 8192 game engine and is subject to the same licensing terms as the main project.
