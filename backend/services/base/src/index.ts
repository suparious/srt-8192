import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';
import mongoose from 'mongoose';
import { validateEnv, parseDuration } from './utils/envValidator';
import { HealthChecker } from './utils/healthCheck';

// Validate environment variables
const env = validateEnv();

// Configure logger
const logger = createLogger({
  level: env.LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Create Express app
const app = express();

// Initialize health checker
const healthChecker = new HealthChecker(
  {
    serviceName: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    mongodb: true,
    redis: !!env.REDIS_URI
  },
  { HEALTH_CHECK_TIMEOUT: env.HEALTH_CHECK_TIMEOUT }
);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.CORS_ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', healthChecker.middleware);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      user: env.MONGODB_USER,
      pass: env.MONGODB_PASSWORD,
      authSource: 'admin'
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Wait for dependent services
async function waitForServices() {
  if (!env.WAIT_FOR_SERVICES) {
    return;
  }

  const net = require('net');
  const timeout = parseDuration(env.HEALTH_CHECK_TIMEOUT);

  for (const service of env.WAIT_FOR_SERVICES) {
    let connected = false;
    let attempts = 0;
    const maxAttempts = env.HEALTH_CHECK_RETRIES;

    while (!connected && attempts < maxAttempts) {
      try {
        await new Promise<void>((resolve, reject) => {
          const socket = new net.Socket();
          
          socket.setTimeout(timeout);
          
          socket.on('connect', () => {
            socket.destroy();
            connected = true;
            resolve();
          });
          
          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Connection timeout'));
          });
          
          socket.on('error', (err) => {
            socket.destroy();
            reject(err);
          });

          socket.connect(service.port, service.host);
        });
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          logger.error(`Failed to connect to ${service.host}:${service.port} after ${maxAttempts} attempts`);
          process.exit(1);
        }
        logger.warn(`Waiting for ${service.host}:${service.port}... Attempt ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    logger.info(`Successfully connected to ${service.host}:${service.port}`);
  }
}

// Graceful shutdown
function handleShutdown() {
  logger.info('Received shutdown signal');
  
  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Clean up resources
    healthChecker.cleanup();
    
    // Disconnect from MongoDB
    mongoose.disconnect()
      .then(() => logger.info('MongoDB disconnected'))
      .catch(err => logger.error('Error disconnecting from MongoDB:', err))
      .finally(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      });
  });

  // Force shutdown if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, parseDuration(env.HEALTH_CHECK_TIMEOUT));
}

// Start server
async function startServer() {
  try {
    // Wait for dependent services
    await waitForServices();

    // Connect to MongoDB
    await connectToMongoDB();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`${env.SERVICE_NAME} listening on port ${env.PORT}`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export const server = startServer();
export { app, logger };