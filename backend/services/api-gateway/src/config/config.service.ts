import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { RedisService } from 'nestjs-redis';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly dynamicConfig: Map<string, any> = new Map();

  constructor(
    private readonly configService: NestConfigService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeDynamicConfig();
  }

  private async initializeDynamicConfig() {
    try {
      // Subscribe to Redis configuration channel for real-time updates
      const redis = await this.redisService.getClient();
      redis.subscribe('config:updates');

      redis.on('message', async (channel, message) => {
        if (channel === 'config:updates') {
          const update = JSON.parse(message);
          await this.updateConfig(update);
        }
      });

      // Load initial dynamic configuration from Redis
      const configKeys = await redis.keys('config:*');
      for (const key of configKeys) {
        const value = await redis.get(key);
        if (value) {
          this.dynamicConfig.set(key.replace('config:', ''), JSON.parse(value));
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize dynamic configuration:', error);
    }
  }

  private async updateConfig(update: { key: string; value: any }) {
    try {
      this.dynamicConfig.set(update.key, update.value);
      
      // Store in Redis for persistence
      const redis = await this.redisService.getClient();
      await redis.set(`config:${update.key}`, JSON.stringify(update.value));
      
      // Emit event for subscribers
      this.eventEmitter.emit('config.updated', update);
      
      this.logger.log(`Configuration updated: ${update.key}`);
    } catch (error) {
      this.logger.error(`Failed to update configuration ${update.key}:`, error);
    }
  }

  // Get service URL
  getServiceUrl(serviceName: string): string {
    const baseUrl = this.getFromEnvOrDynamic(`${serviceName.toUpperCase()}_URL`);
    const port = this.getFromEnvOrDynamic(`${serviceName.toUpperCase()}_PORT`);
    return `${baseUrl}:${port}`;
  }

  // Get circuit breaker settings
  getCircuitBreakerSettings(): { failureThreshold: number; resetTimeout: number } {
    return {
      failureThreshold: this.getFromEnvOrDynamic('CIRCUIT_BREAKER_FAILURE_THRESHOLD'),
      resetTimeout: this.getFromEnvOrDynamic('CIRCUIT_BREAKER_RESET_TIMEOUT'),
    };
  }

  // Get health check interval
  getHealthCheckInterval(): number {
    return this.getFromEnvOrDynamic('HEALTH_CHECK_INTERVAL');
  }

  // Get rate limit settings
  getRateLimitSettings(): { ttl: number; max: number } {
    return {
      ttl: this.getFromEnvOrDynamic('RATE_LIMIT_TTL'),
      max: this.getFromEnvOrDynamic('RATE_LIMIT_MAX'),
    };
  }

  // Update dynamic configuration
  async setDynamicConfig(key: string, value: any): Promise<void> {
    await this.updateConfig({ key, value });
  }

  // Helper method to get value from environment or dynamic config
  private getFromEnvOrDynamic(key: string): any {
    // Check dynamic config first
    if (this.dynamicConfig.has(key)) {
      return this.dynamicConfig.get(key);
    }

    // Fall back to environment config
    return this.configService.get(key);
  }

  // Get all current configuration
  getAllConfig(): Record<string, any> {
    const config: Record<string, any> = {};
    
    // Add environment configuration
    for (const key of Object.keys(process.env)) {
      if (!key.startsWith('_')) {
        config[key] = this.configService.get(key);
      }
    }

    // Add dynamic configuration
    for (const [key, value] of this.dynamicConfig.entries()) {
      config[key] = value;
    }

    return config;
  }

  // Get service-specific configuration
  getServiceConfig(serviceName: string): Record<string, any> {
    const servicePrefix = serviceName.toUpperCase();
    const config: Record<string, any> = {};

    for (const [key, value] of Object.entries(this.getAllConfig())) {
      if (key.startsWith(servicePrefix)) {
        config[key] = value;
      }
    }

    return config;
  }
}