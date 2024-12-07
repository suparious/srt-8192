import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { deepMerge } from './utils/deep-merge';

export class ConfigLoader {
  private static readonly logger = new Logger('ConfigLoader');

  static async loadConfig(env: string = process.env.NODE_ENV || 'development'): Promise<any> {
    try {
      // Load base configuration
      const baseConfig = await import('./environments/development').then(m => m.default);
      
      if (env === 'development') {
        return baseConfig;
      }

      // Load environment-specific configuration
      try {
        const envConfig = await import(`./environments/${env}`).then(m => m.default);
        return deepMerge(baseConfig, envConfig);
      } catch (error) {
        this.logger.warn(`No configuration found for environment: ${env}, using development config`);
        return baseConfig;
      }
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  static async validateConfig(config: any): Promise<boolean> {
    try {
      // Basic validation
      if (!config.services) {
        throw new Error('Missing services configuration');
      }

      // Validate required services
      const requiredServices = [
        'gameLogic',
        'ai',
        'dataIntegration'
      ];

      for (const service of requiredServices) {
        if (!config.services[service]) {
          throw new Error(`Missing configuration for required service: ${service}`);
        }
      }

      // Validate game settings
      if (!config.gameSettings?.cycleLength || config.gameSettings.cycleLength !== 73.828) {
        throw new Error('Invalid game cycle length');
      }

      if (!config.gameSettings?.totalCycles || config.gameSettings.totalCycles !== 8192) {
        throw new Error('Invalid total cycles configuration');
      }

      return true;
    } catch (error) {
      this.logger.error(`Configuration validation failed: ${error.message}`);
      throw error;
    }
  }

  static getConfigFilePath(env: string): string {
    return path.join(__dirname, 'environments', `${env}.ts`);
  }

  static async writeConfig(env: string, config: any): Promise<void> {
    const filePath = this.getConfigFilePath(env);
    const configContent = `export default ${JSON.stringify(config, null, 2)};`;

    try {
      await fs.promises.writeFile(filePath, configContent);
      this.logger.log(`Configuration written to ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write configuration: ${error.message}`);
      throw error;
    }
  }

  static async reloadConfig(): Promise<any> {
    const env = process.env.NODE_ENV || 'development';
    
    // Clear require cache for configuration files
    Object.keys(require.cache).forEach(key => {
      if (key.includes('environments')) {
        delete require.cache[key];
      }
    });

    return this.loadConfig(env);
  }
}