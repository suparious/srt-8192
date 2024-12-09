const fs = require('fs').promises;
const path = require('path');
const PORTS = require('../../config/ports.json');

const SERVICE_DIRS = {
    'game-logic': 'game-logic-service',
    'ai-service': 'ai-service',
    'data-integration': 'data-integration',
    'economy': 'economy-management',
    'leaderboard': 'leaderboard-service',
    'matchmaking': 'matchmaking-service',
    'notifications': 'notification-service',
    'persistence': 'persistence-service',
    'rewards': 'rewards-service',
    'social': 'social-service',
    'tutorial': 'tutorial-service',
    'user': 'user-service',
    'api-gateway': 'api-gateway'
};

async function generateEnvFiles() {
    const servicesDir = path.join(__dirname, '..', 'services');
    const baseEnvPath = path.join(servicesDir, 'base', '.env.example');

    try {
        // Read base .env.example
        let baseEnv = await fs.readFile(baseEnvPath, 'utf8').catch(() => {
            console.log('Base .env.example not found, creating default...');
            return `PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/srt-8192
REDIS_URI=redis://redis:6379
API_GATEWAY_URL=http://api-gateway:5000
LOG_LEVEL=debug
SERVICE_NAME=base-service
ENABLE_DEBUGGING=true`;
        });

        // Process each service from our config
        for (const [serviceName, serviceDir] of Object.entries(SERVICE_DIRS)) {
            const fullServicePath = path.join(servicesDir, serviceDir);
            
            // Ensure service directory exists
            await fs.mkdir(fullServicePath, { recursive: true });

            // Get port from our config
            const port = PORTS[serviceName] || 3000;

            // Create .env content
            let envContent = baseEnv
                .replace('PORT=3000', `PORT=${port}`)
                .replace('SERVICE_NAME=base-service', `SERVICE_NAME=${serviceName}`);

            // Create different env files
            const files = {
                '.env': envContent,
                '.env.development': envContent,
                '.env.production': envContent
                    .replace('NODE_ENV=development', 'NODE_ENV=production')
                    .replace('ENABLE_DEBUGGING=true', 'ENABLE_DEBUGGING=false'),
                '.env.example': baseEnv
            };

            // Write all env files
            for (const [filename, content] of Object.entries(files)) {
                const filePath = path.join(fullServicePath, filename);
                await fs.writeFile(filePath, content);
            }

            console.log(`Generated environment files for ${serviceName}`);
        }
    } catch (error) {
        console.error('Error generating environment files:', error);
        process.exit(1);
    }
}

generateEnvFiles().catch(console.error);