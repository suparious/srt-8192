import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ServiceRegistryModule } from './service-registry/service-registry.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Redis
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
      }),
      inject: [ConfigService],
    }),

    // Core modules
    ServiceRegistryModule,
    AuthModule,
    GameModule,
    WebsocketModule,
  ],
})
export class AppModule {}