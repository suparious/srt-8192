import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { parseDuration } from './envValidator';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface HealthCheckOptions {
  serviceName: string;
  version: string;
  mongodb?: boolean;
  redis?: boolean;
  additionalChecks?: Array<() => Promise<{ name: string; healthy: boolean; error?: string }>>;
}

export class HealthChecker {
  private status: HealthStatus;
  private redisClient?: Redis;
  private checkTimeout: number;
  private options: HealthCheckOptions;

  constructor(options: HealthCheckOptions, env: { HEALTH_CHECK_TIMEOUT: string }) {
    this.options = options;
    this.checkTimeout = parseDuration(env.HEALTH_CHECK_TIMEOUT);
    
    this.status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: options.version,
      services: {},
      uptime: process.uptime(),
      memory: this.getMemoryStats()
    };

    // Initialize Redis client if needed
    if (options.redis) {
      this.redisClient = new Redis();
    }
  }

  /**
   * Get memory statistics
   */
  private getMemoryStats() {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  /**
   * Check MongoDB connection health
   */
  private async checkMongoDB(): Promise<{ healthy: boolean; error?: string }> {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected');
      }
      await mongoose.connection.db.admin().ping();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown MongoDB error' 
      };
    }
  }

  /**
   * Check Redis connection health
   */
  private async checkRedis(): Promise<{ healthy: boolean; error?: string }> {
    if (!this.redisClient) {
      return { healthy: true };
    }

    try {
      await this.redisClient.ping();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown Redis error' 
      };
    }
  }

  /**
   * Run all health checks
   */
  private async runHealthChecks(): Promise<void> {
    const startTime = Date.now();
    const checks: Promise<void>[] = [];

    // MongoDB check
    if (this.options.mongodb) {
      checks.push(
        this.checkMongoDB().then(result => {
          this.status.services.mongodb = {
            status: result.healthy ? 'healthy' : 'unhealthy',
            latency: Date.now() - startTime,
            ...(result.error && { error: result.error })
          };
        })
      );
    }

    // Redis check
    if (this.options.redis) {
      checks.push(
        this.checkRedis().then(result => {
          this.status.services.redis = {
            status: result.healthy ? 'healthy' : 'unhealthy',
            latency: Date.now() - startTime,
            ...(result.error && { error: result.error })
          };
        })
      );
    }

    // Additional checks
    if (this.options.additionalChecks) {
      this.options.additionalChecks.forEach(check => {
        checks.push(
          check().then(result => {
            this.status.services[result.name] = {
              status: result.healthy ? 'healthy' : 'unhealthy',
              latency: Date.now() - startTime,
              ...(result.error && { error: result.error })
            };
          })
        );
      });
    }

    // Wait for all checks with timeout
    try {
      await Promise.race([
        Promise.all(checks),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.checkTimeout)
        )
      ]);
    } catch (error) {
      this.status.status = 'degraded';
      if (error instanceof Error) {
        Object.values(this.status.services).forEach(service => {
          if (!service.status) {
            service.status = 'unhealthy';
            service.error = error.message;
          }
        });
      }
    }

    // Update status based on service results
    const unhealthyServices = Object.values(this.status.services)
      .filter(service => service.status === 'unhealthy').length;

    this.status.status = unhealthyServices === 0 ? 'healthy' :
      unhealthyServices === Object.keys(this.status.services).length ? 'unhealthy' : 'degraded';

    // Update timestamp and system metrics
    this.status.timestamp = new Date().toISOString();
    this.status.uptime = process.uptime();
    this.status.memory = this.getMemoryStats();
  }

  /**
   * Express middleware for health check endpoint
   */
  public middleware = async (req: Request, res: Response) => {
    await this.runHealthChecks();

    const httpStatus = this.status.status === 'healthy' ? 200 :
      this.status.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(this.status);
  };

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }
}