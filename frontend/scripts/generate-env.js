const fs = require('fs').promises;
const path = require('path');

async function generateFrontendEnvFiles() {
    const envExample = `# Frontend Environment Configuration

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false

# Game Configuration
NEXT_PUBLIC_GAME_VERSION=0.1.0
NEXT_PUBLIC_MAX_TURNS_PER_DAY=50
NEXT_PUBLIC_TURN_DURATION_MS=73828

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=auth.example.com
NEXT_PUBLIC_AUTH_CLIENT_ID=your-client-id

# Performance
NEXT_PUBLIC_ASSET_PREFIX=
NEXT_PUBLIC_CACHE_MAX_AGE=3600

# Development
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_API_MOCKING=false`;

    try {
        // Write .env.example
        await fs.writeFile(
            path.join(__dirname, '..', '.env.example'),
            envExample
        );

        // Create .env.development
        const devEnv = envExample.replace('NEXT_PUBLIC_DEBUG_MODE=true', 'NEXT_PUBLIC_DEBUG_MODE=true');
        await fs.writeFile(
            path.join(__dirname, '..', '.env.development'),
            devEnv
        );

        // Create .env.production
        const prodEnv = envExample
            .replace('NEXT_PUBLIC_DEBUG_MODE=true', 'NEXT_PUBLIC_DEBUG_MODE=false')
            .replace('NEXT_PUBLIC_API_MOCKING=false', 'NEXT_PUBLIC_API_MOCKING=false')
            .replace('http://localhost:5000', 'https://api.srt8192.com')
            .replace('ws://localhost:5000', 'wss://api.srt8192.com');
        await fs.writeFile(
            path.join(__dirname, '..', '.env.production'),
            prodEnv
        );

        console.log('Generated frontend environment files successfully');
    } catch (error) {
        console.error('Error generating frontend environment files:', error);
        process.exit(1);
    }
}

generateFrontendEnvFiles().catch(console.error);