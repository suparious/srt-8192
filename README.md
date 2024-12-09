# 8192 Game Development

## Quick Start Guide

### Prerequisites
- Docker Desktop
- Node.js 18 or higher
- npm 9 or higher

### First Time Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/srt-8192.git
cd srt-8192
```

2. Install dependencies:
```bash
npm install
```

3. Build the base service image first:
```bash
# Build the base service image that all backend services extend from
docker build -t srt-8192/base-service:latest ./backend/services/base
```

4. Generate environment files:
```bash
npm run generate:env
```

5. Start the development environment:
```bash
npm run dev
```

### Development Commands

- `npm run dev` - Start the development environment
- `npm run generate:env` - Generate environment files
- `npm run build` - Build all services
- `npm run test` - Run tests
- `npm run lint` - Run linter

### Troubleshooting

If you see "PORT not set" warnings during startup, don't worry! These are expected and the services will use their default ports.

Common issues:
1. **Docker build fails**: Make sure Docker Desktop is running
2. **Missing dependencies**: Run `npm install` again
3. **Port conflicts**: Check if ports 3000-5012 are available

For more detailed information, check the docs folder or open an issue on GitHub.

## Documentation

- [Game Design Bible](docs/Game_Design_Bible.md)
- [Technical Design Document](docs/Technical_Design_Document.md)
- [Infrastructure Architecture](docs/Infrastructure_Architecture.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.