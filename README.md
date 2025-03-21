# Connect 4 Game

A modern implementation of the classic Connect 4 game using Next.js, React, and TypeScript.

## Features

- Classic Connect 4 gameplay
- Player vs CPU gameplay
- Responsive design with Tailwind CSS
- Server-side game logic

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

This application follows a client-server architecture:

- **Client**: React components handling the UI and user interactions
- **Server**: Next.js API routes implementing game logic
- **Game Engine**: Core game logic implemented in `lib/game-engine.ts`

## Testing

The application includes comprehensive tests using Vitest and React Testing Library.

### Running Tests

To run all tests:

```bash
npm test
# or
pnpm test
```

To run tests with the UI:

```bash
npm run test:ui
# or
pnpm test:ui
```

To generate test coverage:

```bash
npm run test:coverage
# or
pnpm run test:coverage
```

### Test Structure

- `test/lib/game-engine.test.ts`: Unit tests for game logic
- `test/app/api/game/api.test.ts`: Integration tests for API endpoints
- `test/components/game-board.test.tsx`: Component tests for the game board

## Deployment

This app can be deployed to Vercel or any other Node.js hosting platform.

```bash
npm run build
npm run start
```

## License

This project is licensed under the MIT License. 