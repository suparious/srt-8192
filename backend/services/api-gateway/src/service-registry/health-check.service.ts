import { Injectable, Logger } from '@nestjs/common';
import { promisify } from 'util';
import * as grpc from '@grpc/grpc-js';

@Injectable()
export class HealthCheck {
  private readonly logger = new Logger(HealthCheck.name);

  async checkService(service: any): Promise<boolean> {
    try {
      const client = service.client;
      if (!client || !client.check) {
        return false;
      }

      // Convert gRPC health check to promise
      const check = promisify(client.check).bind(client);
      const response = await check({});

      return response.status === 'SERVING';
    } catch (error) {
      this.logger.error(`Health check failed for service: ${error.message}`);
      return false;
    }
  }
}