const fs = require('fs').promises;
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '..', 'backend', 'services');

// Template for service Dockerfile
const generateDockerfileContent = (serviceName, port) => `# Extend from base service image
FROM srt-8192/base-service:latest

# Service-specific environment variables
ENV SERVICE_NAME=${serviceName} \\
    PORT=${port}

# Copy service-specific files
COPY . .

# Build and run are handled by base image`;

async function generateDockerfiles() {
    try {
        // Get all service directories
        const services = await fs.readdir(SERVICES_DIR);
        
        // Skip base and example services
        const skipServices = ['base', 'example-service'];
        
        // Start port from 5001
        let currentPort = 5001;
        
        for (const service of services) {
            if (skipServices.includes(service)) continue;
            
            const serviceDir = path.join(SERVICES_DIR, service);
            const stats = await fs.stat(serviceDir);
            
            if (stats.isDirectory()) {
                const dockerfilePath = path.join(serviceDir, 'Dockerfile');
                const serviceName = service.replace('-service', '');
                
                await fs.writeFile(
                    dockerfilePath,
                    generateDockerfileContent(serviceName, currentPort)
                );
                
                console.log(`Generated Dockerfile for ${service} on port ${currentPort}`);
                currentPort++;
            }
        }
        
        console.log('All Dockerfiles generated successfully!');
    } catch (error) {
        console.error('Error generating Dockerfiles:', error);
        process.exit(1);
    }
}

generateDockerfiles().catch(console.error);