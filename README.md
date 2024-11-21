# 8192: A Turn-Based Leadership Simulator

## Overview

**8192** is a revolutionary turn-based online multiplayer game that teaches players leadership skills, military and economic management, while competing in a future Earth-type setting where an advanced AI attempts to exterminate humanity. The turn-based gameplay resets every 8192 cycles, allowing new players to join in and helping maintain balance while rewarding long-term players with permanent in-game rewards, including coins, experience, profile badges, and rare skins.

**8192** is part of a larger simulation game called **LeadSim**, which itself is part of the expansive virtual world known as **Future Earth**, developed and operated by **SolidRusT Networks (SRT)**.

## Core Features

### Gameplay
- **Turn-Based Strategy**: Experience deep strategic gameplay with 8192-cycle game sessions
- **Leadership Development**: Learn and apply real-world leadership skills
- **AI Integration**: Face an adaptive AI opponent that learns from global player behavior
- **Real-World Data**: Game mechanics influenced by real-world economic and geopolitical data
- **Permanent Progress**: Keep your rewards and advancement across game cycles

### Technical Features
- **Progressive Web App**: Cross-platform accessibility
- **Real-time Updates**: WebSocket-based live game state synchronization
- **AI Learning**: Continuous opponent adaptation through reinforcement learning
- **Data Integration**: Real-world economic and environmental data influence gameplay

## Technology Stack

### Frontend (PlayerPortal)
- React 18+ with TypeScript
- Tailwind CSS for styling
- Recoil for state management
- Real-time updates via WebSocket
- Progressive Web App capabilities

### Backend (BrainCore)
- Event-driven microservices architecture
- Advanced AI opponent system (NexusMind)
- Real-world data integration (DataForge)
- Combat resolution engine
- Resource management system

### Infrastructure
- Kubernetes deployment (ClusterCommander)
- Multi-region cloud architecture
- Event sourcing for game state
- Real-time analytics and monitoring

## Documentation

### Game Design
- [Game Design Bible](docs/Game_Design_Bible.md) - Complete game mechanics and systems
- [Balance Guide](docs/Game_Balance_Guide.md) - Resource and combat balancing
- [Turn System](docs/TurnSystem_Explanation.md) - Turn mechanics and flow

### Technical Documentation
- [AI Strategy](docs/AI_Strategy_and_Behavior.md) - NexusMind AI system design
- [AI Behavior Examples](docs/AI_Behavior_Examples.md) - Practical AI implementation examples
- [Infrastructure Architecture](docs/Infrastructure_Architecture.md) - System architecture
- [Performance Scaling](docs/Performance_Scaling.md) - Scaling strategies
- [Educational Framework](docs/Educational_Framework.md) - Leadership development implementation

### Development Guides
- [Technical Design Document](docs/Technical_Design_Document.md) - Technical specifications
- [Contributing Guidelines](CONTRIBUTING.md) - Development workflow
- [Security Policy](SECURITY.md) - Security practices
- [Testing Guide](TESTING.md) - Testing procedures

## Project Structure
```
8192/
├── backend/
│   ├── ai/                 # AI opponent logic & ML models
│   ├── data-integration/   # Real-world data processing
│   ├── game-logic/         # Core game mechanics
│   └── services/           # Microservices
├── frontend/
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── styles/            # Global styles
│   └── types/             # TypeScript definitions
├── docs/                  # Documentation
└── scripts/              # Deployment scripts
```

## Getting Started

### Prerequisites
```bash
Node.js >= 18
Docker & Docker Compose
Kubernetes (for full deployment)
```

### Installation
```bash
git clone https://github.com/SolidRusT/srt-8192.git
cd srt-8192
npm install
```

### Development
```bash
# Start frontend development server
npm run dev

# Start backend services
docker-compose up
```

### Testing
```bash
# Launch test environment
docker-compose -p srt-8192-dev up -d

# Run backend tests
docker exec -it srt-8192-dev_game-logic_1 npm test

# Run frontend tests
docker exec -it srt-8192-dev_frontend_1 npm test
```

### Production Deployment
```bash
# Build frontend
npm run build

# Deploy to Kubernetes
./scripts/deploy.sh
```

## Key Components

### BrainCore (Backend)
- **NexusMind**: Advanced AI opponent system using reinforcement learning
- **DataForge**: Real-world data integration pipeline
- **Combat Engine**: Sophisticated battle resolution system
- **Resource Manager**: Economic and resource distribution system

### PlayerPortal (Frontend)
- **GameBoard**: Main game interface component
- **ActionPanel**: Player control and command interface
- **ResourceDisplay**: Resource management UI
- **UnitManager**: Military unit control interface

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests. Join our [Discord server](https://discord.gg/UMWQmCz7uF) for discussions and updates.

## Support

- Documentation: [docs/](./docs/)
- Discord: [Join Server](https://discord.gg/UMWQmCz7uF)
- Email: support@solidrust.net

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Security

For security concerns, please review our [Security Policy](SECURITY.md).

## Acknowledgments

- The SolidRusT Networks team
- Our active community of playtesters
- All contributors to the LeadSim project

---

Built with 💙 by SolidRusT Networks
