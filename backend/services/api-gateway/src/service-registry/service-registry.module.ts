import { Module } from '@nestjs/common';
import { ServiceRegistry } from './service-registry.service';
import { HealthCheck } from './health-check.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ServiceRegistry, HealthCheck],
  exports: [ServiceRegistry],
})
export class ServiceRegistryModule {}