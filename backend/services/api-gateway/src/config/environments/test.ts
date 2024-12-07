export default {
  services: {
    gameLogic: {
      url: 'localhost',
      port: 5001,
      maxConnections: 10,
      timeout: 1000,
    },
    ai: {
      url: 'localhost',
      port: 5002,
      maxComputeTime: 500,
      batchSize: 10,
    },
    dataIntegration: {
      url: 'localhost',
      port: 5003,
      cacheSize: '128mb',
      refreshInterval: 60000,
    },
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: null,
  },
  security: {
    rateLimiting: {
      enabled: false,
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
      enabled: false,
    },
    tracing: {
      enabled: false,
    },
  },
  gameSettings: {
    maxPlayersPerGame: 10,
    cycleLength: 73.828,
    totalCycles: 8192,
    actionQueueSize: 100,
  },
};