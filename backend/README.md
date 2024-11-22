# Backend directory tree

```bash
backend/
├── shared/            # Shared types and utilities for backend services
│   ├── types/              # Common TypeScript types/interfaces
│   │   ├── analytics.ts            # Analytics and metrics types
│   │   ├── combat.ts               # Combat system types
│   │   ├── events.ts               # Event system types
│   │   ├── game.ts                 # Core game types
│   │   ├── index.ts                # Type exports
│   │   ├── player.ts               # Player-related types
│   │   ├── resources.ts            # Resource system types
│   │   └── world.ts                # World state types
│   ├── constants/             # Shared constants
│   │   ├── gameConfig.ts           # Game configuration constants
│   │   ├── resourceLimits.ts       # Resource limit constants
│   │   └── errorCodes.ts           # Error code definitions
│   └── validation/            # Shared validation schemas
│       ├── combat.ts               # Combat action validation
│       ├── player.ts               # Player action validation
│       └── resources.ts            # Resource transaction validation
├── lib/                 # Shared backend libraries
│   ├── service-base/          # Base package for all services
│   │   ├── src/
│   │   │   ├── middleware/      # Common Express middleware
│   │   │   │   ├── auth.ts        # Authentication middleware
│   │   │   │   ├── error.ts       # Error handling middleware
│   │   │   │   ├── logging.ts     # Request logging middleware
│   │   │   │   └── validation.ts  # Request validation middleware
│   │   │   ├── utils/           # Utility functions
│   │   │   │   ├── envValidator.ts # Environment validation
│   │   │   │   ├── healthCheck.ts # Health check implementation
│   │   │   │   └── logger.ts      # Logging configuration
│   │   │   └── index.ts           # Package entry point
│   │   ├── tests/               # Tests for base package
│   │   └── package.json         # Base package dependencies
│   └── game-core/             # Core game logic library
│       ├── src/
│       │   ├── combat/           # Combat system logic
│       │   ├── resources/        # Resource management logic
│       │   ├── state/            # Game state management
│       │   └── index.ts          # Package entry point
│       ├── tests/                # Game core tests
│       └── package.json          # Game core dependencies
├── services/                # Individual microservices
│   ├── base/                  # Base service template
│   │   ├── src/
│   │   │   ├── utils/           # Service-specific utilities
│   │   │   └── index.ts         # Service entry point
│   │   ├── tests/             # Service tests
│   │   ├── Dockerfile           # Service Dockerfile
│   │   ├── docker-entrypoint.sh # Service entrypoint script
│   │   ├── package.json         # Service dependencies
│   │   └── tsconfig.json        # TypeScript configuration
│   ├── ai-service/              # AI opponent service
│   ├── data-integration/        # External data integration service
│   ├── economy-management/      # Economic system service
│   ├── game-logic-service/      # Core game logic service
│   ├── leaderboard-service/     # Leaderboard management service
│   ├── matchmaking-service/     # Player matchmaking service
│   ├── notification-service/    # Player notification service
│   ├── persistence-service/     # Game state persistence service
│   ├── rewards-service/         # Player rewards service
│   ├── social-service/         # Player social features service
│   ├── tutorial-service/       # Tutorial management service
│   └── user-service/           # User management service
├── config/                     # Shared configuration
│   ├── jest/                   # Jest test configuration
│   │   ├── jest.config.base.js # Base Jest configuration
│   │   └── jest.setup.js      # Jest setup file
│   ├── typescript/            # TypeScript configuration
│   │   └── tsconfig.base.json # Base TypeScript configuration
│   └── eslint/               # ESLint configuration
│       └── eslint.config.js  # Base ESLint configuration
├── scripts/                  # Build and deployment scripts
│   ├── build.sh             # Build all services
│   ├── test.sh              # Run all tests
│   └── deploy.sh            # Deployment script
├── docker/                  # Docker configuration
│   ├── development/         # Development Docker files
│   │   └── mongo-init.js    # MongoDB initialization
│   └── production/          # Production Docker files
│       └── nginx.conf       # Nginx configuration
├── .env.example             # Example environment variables
├── docker-compose.yml       # Base Docker Compose configuration
├── docker-compose.dev.yml   # Development overrides
├── docker-compose.prod.yml  # Production overrides
└── README.md                # Backend documentation
```