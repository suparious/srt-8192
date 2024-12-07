export default {
  services: {
    gameLogic: {
      url: 'localhost',
      port: 5001,
      maxConnections: 100,
      timeout: 5000,
    },
    ai: {
      url: 'localhost',
      port: 5002,
      maxComputeTime: 2000,
      batchSize: 50,
    },
    dataIntegration: {
      url: 'localhost',
      port: 5003,
      cacheSize: '512mb',
      refreshInterval: 300000,
    },
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: null,
  },
  security: {
    rateLimiting: {
      enabled: true,
      maxRequests: 1000,
      windowMs: 60000,
    },
    cors: {
      enabled: true,
      origin: '*',
    },
  },
  logging: {
    level: 'debug',
    prettify: true,
  },
  monitoring: {
    metrics: {
      enabled: true,
      interval: 10000,
    },
    tracing: {
      enabled: true,
      sampleRate: 1.0,
    },
  },
  gameSettings: {
    maxPlayersPerGame: 100,
    cycleLength: 73.828,
    totalCycles: 8192,
    actionQueueSize: 1000,
  },
};