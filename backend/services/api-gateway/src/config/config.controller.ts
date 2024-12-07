import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('Configuration')
@Controller('config')
@ApiBearerAuth()
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all configuration' })
  async getAllConfig() {
    return this.configService.getAllConfig();
  }

  @Get('service/:serviceName')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get service-specific configuration' })
  async getServiceConfig(@Param('serviceName') serviceName: string) {
    return this.configService.getServiceConfig(serviceName);
  }

  @Put('dynamic/:key')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update dynamic configuration' })
  async updateDynamicConfig(
    @Param('key') key: string,
    @Body() update: { value: any }
  ) {
    await this.configService.setDynamicConfig(key, update.value);
    return { success: true };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get health check configuration' })
  async getHealthConfig() {
    return {
      interval: this.configService.getHealthCheckInterval(),
      circuitBreaker: this.configService.getCircuitBreakerSettings(),
    };
  }
}