const fs = require('fs').promises;
const path = require('path');

const PORTS = require('../config/ports.json');
const SERVICES_DIR = path.join(__dirname, '..', 'backend', 'services');

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

async function updateServicePorts() {
    try {
        // Update environment files for each service
        for (const [serviceName, port] of Object.entries(PORTS)) {
            if (serviceName === 'frontend') continue;
            
            const serviceDir = SERVICE_DIRS[serviceName];
            if (!serviceDir) {
                console.warn(`Warning: No directory mapping for service ${serviceName}`);
                continue;
            }
            
            const envPath = path.join(SERVICES_DIR, serviceDir, '.env');
            
            try {
                let envContent = await fs.readFile(envPath, 'utf8');
                envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
                await fs.writeFile(envPath, envContent);
                console.log(`Updated ${serviceName} environment with port ${port}`);
            } catch (err) {
                console.warn(`Warning: Could not update ${serviceName} environment file:`, err.message);
            }
        }
        
        console.log('Environment synchronization complete!');
    } catch (error) {
        console.error('Error updating environments:', error);
        process.exit(1);
    }
}

updateServicePorts().catch(console.error);