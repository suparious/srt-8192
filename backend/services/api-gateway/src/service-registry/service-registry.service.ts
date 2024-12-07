import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck } from './health-check.service';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ActionType } from '../game/dto/submit-action.dto';
import { CircuitBreaker } from './circuit-breaker';

interface ServiceDefinition {
  name: string;
  url: string;
  port: number;
  client?: any;
  circuitBreaker: CircuitBreaker;
  meta?: {
    actionTypes?: ActionType[];
    priority?: number;
  };
}

@Injectable()
export class ServiceRegistry implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceRegistry.name);
  private services: Map<string, ServiceDefinition> = new Map();
  private readonly actionServiceMap: Map<ActionType, string[]> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly healthCheck: HealthCheck,
  ) {
    // Initialize action type to service mappings
    Object.values(ActionType).forEach(type => {
      this.actionServiceMap.set(type, []);
    });
  }

  async onModuleInit() {
    // Initialize service connections
    await this.initializeServices();
    
    // Start health checking
    this.startHealthChecks();
  }

  async onModuleDestroy() {
    // Clean up service connections
    for (const [_, service] of this.services) {
      if (service.client) {
        service.client.close();
      }
    }
  }

  private async initializeServices() {
    // Define core services
    const serviceDefinitions: ServiceDefinition[] = [
      {
        name: 'game-logic',
        url: this.configService.get('services.gameLogic.url', 'localhost'),
        port: this.configService.get('services.gameLogic.port', 5001),
        circuitBreaker: new CircuitBreaker(),
        meta: {
          actionTypes: [ActionType.MOVE, ActionType.ATTACK, ActionType.BUILD],
          priority: 1,
        },
      },
      {
        name: 'ai-service',
        url: this.configService.get('services.ai.url', 'localhost'),
        port: this.configService.get('services.ai.port', 5002),
        circuitBreaker: new CircuitBreaker(),
        meta: {
          priority: 2,
        },
      },
      {
        name: 'data-integration',
        url: this.configService.get('services.dataIntegration.url', 'localhost'),
        port: this.configService.get('services.dataIntegration.port', 5003),
        circuitBreaker: new CircuitBreaker(),
        meta: {
          priority: 3,
        },
      },
      // Add other services...
    ];

    // Initialize each service
    for (const definition of serviceDefinitions) {
      await this.initializeService(definition);
    }
  }

  private async initializeService(definition: ServiceDefinition) {
    try {
      // Load service proto file
      const protoPath = `${__dirname}/protos/${definition.name}.proto`;
      const packageDefinition = await protoLoader.load(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      // Create gRPC client
      const proto = grpc.loadPackageDefinition(packageDefinition);
      const client = new proto[definition.name][definition.name + 'Service'](
        `${definition.url}:${definition.port}`,
        grpc.credentials.createInsecure(),
      );

      // Store service definition
      definition.client = client;
      this.services.set(definition.name, definition);

      // Map action types to services
      if (definition.meta?.actionTypes) {
        definition.meta.actionTypes.forEach(type => {
          const services = this.actionServiceMap.get(type) || [];
          services.push(definition.name);
          this.actionServiceMap.set(type, services);
        });
      }

      this.logger.log(`Service ${definition.name} initialized`);
    } catch (error) {
      this.logger.error(`Failed to initialize service ${definition.name}:`, error);
      throw error;
    }
  }

  private startHealthChecks() {
    // Check health of all services periodically
    setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          const isHealthy = await this.healthCheck.checkService(service);
          if (!isHealthy && !service.circuitBreaker.isOpen()) {
            service.circuitBreaker.trip();
            this.logger.warn(`Circuit breaker tripped for service ${name}`);
          } else if (isHealthy && service.circuitBreaker.isOpen()) {
            service.circuitBreaker.reset();
            this.logger.log(`Circuit breaker reset for service ${name}`);
          }
        } catch (error) {
          this.logger.error(`Health check failed for ${name}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  async getService(serviceName: string) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    if (service.circuitBreaker.isOpen()) {
      throw new Error(`Service ${serviceName} is currently unavailable`);
    }

    return service.client;
  }

  async getServiceForAction(actionType: ActionType) {
    const serviceNames = this.actionServiceMap.get(actionType);
    if (!serviceNames || serviceNames.length === 0) {
      throw new Error(`No service found for action type ${actionType}`);
    }

    // Find first available service that can handle this action type
    for (const serviceName of serviceNames) {
      const service = this.services.get(serviceName);
      if (service && !service.circuitBreaker.isOpen()) {
        return service.client;
      }
    }

    throw new Error(`No available service found for action type ${actionType}`);
  }

  getHealthStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, service] of this.services) {
      status[name] = !service.circuitBreaker.isOpen();
    }
    return status;
  }
}