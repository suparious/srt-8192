import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  
  // Service endpoints
  GAME_LOGIC_URL: Joi.string().default('localhost'),
  GAME_LOGIC_PORT: Joi.number().default(5001),
  
  AI_SERVICE_URL: Joi.string().default('localhost'),
  AI_SERVICE_PORT: Joi.number().default(5002),
  
  DATA_INTEGRATION_URL: Joi.string().default('localhost'),
  DATA_INTEGRATION_PORT: Joi.number().default(5003),

  ECONOMY_URL: Joi.string().default('localhost'),
  ECONOMY_PORT: Joi.number().default(5004),

  LEADERBOARD_URL: Joi.string().default('localhost'),
  LEADERBOARD_PORT: Joi.number().default(5005),

  MATCHMAKING_URL: Joi.string().default('localhost'),
  MATCHMAKING_PORT: Joi.number().default(5006),

  NOTIFICATIONS_URL: Joi.string().default('localhost'),
  NOTIFICATIONS_PORT: Joi.number().default(5007),

  PERSISTENCE_URL: Joi.string().default('localhost'),
  PERSISTENCE_PORT: Joi.number().default(5008),

  REWARDS_URL: Joi.string().default('localhost'),
  REWARDS_PORT: Joi.number().default(5009),

  SOCIAL_URL: Joi.string().default('localhost'),
  SOCIAL_PORT: Joi.number().default(5010),

  TUTORIAL_URL: Joi.string().default('localhost'),
  TUTORIAL_PORT: Joi.number().default(5011),

  USER_URL: Joi.string().default('localhost'),
  USER_PORT: Joi.number().default(5012),

  // Circuit breaker settings
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: Joi.number().default(5),
  CIRCUIT_BREAKER_RESET_TIMEOUT: Joi.number().default(60000),

  // Health check settings
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
  
  // Rate limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
});

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  services: {
    gameLogic: {
      url: process.env.GAME_LOGIC_URL || 'localhost',
      port: parseInt(process.env.GAME_LOGIC_PORT || '5001', 10),
    },
    ai: {
      url: process.env.AI_SERVICE_URL || 'localhost',
      port: parseInt(process.env.AI_SERVICE_PORT || '5002', 10),
    },
    dataIntegration: {
      url: process.env.DATA_INTEGRATION_URL || 'localhost',
      port: parseInt(process.env.DATA_INTEGRATION_PORT || '5003', 10),
    },
    economy: {
      url: process.env.ECONOMY_URL || 'localhost',
      port: parseInt(process.env.ECONOMY_PORT || '5004', 10),
    },
    leaderboard: {
      url: process.env.LEADERBOARD_URL || 'localhost',
      port: parseInt(process.env.LEADERBOARD_PORT || '5005', 10),
    },
    matchmaking: {
      url: process.env.MATCHMAKING_URL || 'localhost',
      port: parseInt(process.env.MATCHMAKING_PORT || '5006', 10),
    },
    notifications: {
      url: process.env.NOTIFICATIONS_URL || 'localhost',
      port: parseInt(process.env.NOTIFICATIONS_PORT || '5007', 10),
    },
    persistence: {
      url: process.env.PERSISTENCE_URL || 'localhost',
      port: parseInt(process.env.PERSISTENCE_PORT || '5008', 10),
    },
    rewards: {
      url: process.env.REWARDS_URL || 'localhost',
      port: parseInt(process.env.REWARDS_PORT || '5009', 10),
    },
    social: {
      url: process.env.SOCIAL_URL || 'localhost',
      port: parseInt(process.env.SOCIAL_PORT || '5010', 10),
    },
    tutorial: {
      url: process.env.TUTORIAL_URL || 'localhost',
      port: parseInt(process.env.TUTORIAL_PORT || '5011', 10),
    },
    user: {
      url: process.env.USER_URL || 'localhost',
      port: parseInt(process.env.USER_PORT || '5012', 10),
    },
  },

  circuitBreaker: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5', 10),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000', 10),
  },

  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
}));