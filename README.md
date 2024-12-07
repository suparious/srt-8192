# 8192: Turn-Based Leadership Simulator

A sophisticated turn-based leadership simulator focused on teaching strategic thinking, resource management, and decision-making skills through engaging gameplay.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/srt-8192.git
cd srt-8192
```

2. Generate environment files:
```bash
cd backend
npm run generate:env
cd ..
```

3. Start the development environment:
```bash
# Start all services (frontend + backend)
docker-compose up

# Or start with development configurations
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

4. Access the application:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- Service Health Checks: http://localhost:[5001-5012]/health

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| API Gateway | 5000 | API Gateway |
| Game Logic | 5001 | Core game mechanics |
| AI Service | 5002 | NexusMind AI system |
| Data Integration | 5003 | DataForge system |
| Economy | 5004 | Economic simulation |
| Leaderboard | 5005 | Player rankings |
| Matchmaking | 5006 | Player matching |
| Notifications | 5007 | Event notifications |
| Persistence | 5008 | Game state management |
| Rewards | 5009 | Player rewards |
| Social | 5010 | Player interactions |
| Tutorial | 5011 | Learning system |
| User | 5012 | User management |

### Development Commands

```bash
# Start development environment
docker-compose up

# Rebuild services
docker-compose build

# Run tests
npm test

# Run linting
npm run lint

# Generate environment files
npm run generate:env
```

## 🏗️ Architecture

8192 uses a microservices architecture with:
- React frontend with TypeScript
- Node.js microservices for backend
- MongoDB for persistent storage
- Redis for caching and real-time features
- Docker for containerization
- API Gateway for service coordination

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
cd backend/services/[service-name]
npm test

# Run frontend tests
cd frontend
npm test
```

## 📚 Documentation

- [Game Design Documentation](./docs/game-design.md)
- [API Documentation](./docs/api.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the terms of the license found in [LICENSE.md](LICENSE.md).