# 8192: Turn-Based Leadership Simulator

A sophisticated turn-based leadership simulator focused on teaching strategic thinking, resource management, and decision-making skills through engaging gameplay. The game runs in cycles of 8,192 turns, with each turn taking 73.828 seconds, creating a perfect two-week gameplay cycle.

## 🎮 Key Features

- Turn-based strategic gameplay
- Leadership skill development focus
- Adaptive AI opponent (NexusMind)
- Real-world data integration
- Persistent player progression
- Educational framework for leadership training

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-org/srt-8192.git
cd srt-8192
```

2. Install dependencies and generate environment files:
```bash
# Install root dependencies
npm install

# Generate all environment files
npm run generate:env
```

3. Start the development environment:
```bash
# Start all services with development configuration
npm run dev

# Or start without rebuilding
npm start
```

4. Access the application:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- Service Health Checks: http://localhost:[5001-5012]/health

### Common Development Commands

```bash
# Generate environment files
npm run generate:env

# Start development environment (with build)
npm run dev

# Start without rebuilding
npm start

# Stop all services
npm run down

# View logs
npm run logs

# Clean up (remove volumes)
npm run clean

# Run tests
npm test
```

## 🏗️ Project Structure

\`\`\`
srt-8192/
├── frontend/               # React frontend application
├── backend/               # Microservices backend
│   ├── services/         # Individual service directories
│   ├── shared/           # Shared utilities and types
│   └── scripts/          # Backend maintenance scripts
├── scripts/              # Project-wide scripts
└── docker-compose.yml    # Docker composition config
\`\`\`

### Service Architecture

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

## 🔧 Development

### Environment Files
The project uses multiple environment files for different contexts:
- \`.env.development\`: Development configuration
- \`.env.production\`: Production settings
- \`.env.example\`: Template for environment variables

Generate all environment files using:
\`\`\`bash
npm run generate:env
\`\`\`

### Docker Configuration
- All services are containerized using Docker
- Docker Compose orchestrates the service ecosystem
- Health checks ensure service availability
- Automatic service dependency resolution

### Local Development Tips
1. Use \`npm run dev\` for development with hot-reload
2. Monitor logs with \`npm run logs\`
3. Reset environment with \`npm run clean\`
4. Check service health at \`/health\` endpoints

## 🧪 Testing

Each service includes its own test suite:

```bash
# Run all tests
npm test

# Test specific backend service
cd backend/services/[service-name]
npm test

# Test frontend
cd frontend
npm test
```

## 📚 Documentation

- [Game Design](docs/Game_Design_Bible.md)
- [Technical Architecture](docs/Technical_Design_Document.md)
- [AI System](docs/AI_Strategy_and_Behavior.md)
- [Educational Framework](docs/Educational_Framework.md)

## 🤝 Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the terms of the license found in [LICENSE.md](LICENSE.md).

## 🔍 Monitoring & Debugging

### Health Checks
- Each service exposes a health endpoint at \`/health\`
- Monitor service status: \`http://localhost:[PORT]/health\`
- Database health: MongoDB (27017) and Redis (6379)

### Logs
```bash
# All services
npm run logs

# Specific service
docker-compose logs [service-name]
```

## 🚧 Troubleshooting

1. **Services won't start**:
   - Ensure all ports are available
   - Check environment files exist (\`npm run generate:env\`)
   - Verify Docker is running

2. **Database connection issues**:
   - Confirm MongoDB/Redis are running (\`docker ps\`)
   - Check connection strings in environment files
   - Verify network connectivity

3. **Build failures**:
   - Clean Docker environment: \`npm run clean\`
   - Rebuild: \`npm run dev\`
   - Check service logs for errors

For more detailed information, refer to the [Technical Documentation](docs/Technical_Design_Document.md).