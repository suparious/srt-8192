export default {
  services: {
    gameLogic: {
      maxConnections: 1000,
      timeout: 3000,
    },
    ai: {
      maxComputeTime: 1500,
      batchSize: 100,
    },
    dataIntegration: {
      cacheSize: '2gb',
      refreshInterval: 600000,
    },
  },
  redis: {
    password: process.env.REDIS_PASSWORD,
  },
  security: {
    rateLimiting: {
      enabled: true,
      maxRequests: 500,
      windowMs: 60000,
    },
    cors: {
      enabled: true,
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
  },
  logging: {
    level: 'info',
    prettify: false,
  },
  monitoring: {
    metrics: {
      enabled: true,
      interval: 30000,
    },
    tracing: {
      enabled: true,
      sampleRate: 0.1,
    },
  },
  gameSettings: {
    maxPlayersPerGame: 500,
    cycleLength: 73.828,
    totalCycles: 8192,
    actionQueueSize: 5000,
  },
};