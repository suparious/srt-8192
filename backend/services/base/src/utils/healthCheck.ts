import { Application } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

export function setupHealthCheck(app: Application): void {
  app.get('/health', async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'not_configured',
        redis: 'not_configured'
      }
    };

    // Check MongoDB if configured
    if (process.env.MONGODB_URI) {
      health.services.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    }

    // Check Redis if configured
    if (process.env.REDIS_URL) {
      try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        health.services.redis = 'connected';
        redis.disconnect();
      } catch (error) {
        health.services.redis = 'disconnected';
      }
    }

    res.json(health);
  });
}