import { EventEmitter } from 'events';
import {
  WorldState,
  ResourceType,
  GameEvent,
  WorldEventType,
  WeatherCondition,
  EnvironmentalData
} from '../game-logic/types';

interface DataSourceConfig {
  endpoint: string;
  apiKey: string;
  updateInterval: number;
  timeout: number;
  retryAttempts: number;
}

interface DataFetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export class WorldDataFetcher extends EventEmitter {
  private dataSources: Map<string, DataSourceConfig>;
  private fetchIntervals: Map<string, NodeJS.Timeout>;
  private cache: Map<string, any>;
  private readonly cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastUpdate: Date;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.dataSources = new Map();
    this.fetchIntervals = new Map();
    this.cache = new Map();
    this.lastUpdate = new Date();
    this.initializeDataSources();
  }

  /**
   * Initialize default data sources
   */
  private initializeDataSources(): void {
    // Economic data source
    this.addDataSource('economic', {
      endpoint: process.env.ECONOMIC_API_ENDPOINT || 'https://api.worldbank.org/v2',
      apiKey: process.env.ECONOMIC_API_KEY || '',
      updateInterval: 3600000, // 1 hour
      timeout: 10000, // 10 seconds
      retryAttempts: 3
    });

    // Weather data source
    this.addDataSource('weather', {
      endpoint: process.env.WEATHER_API_ENDPOINT || 'https://api.weather.gov',
      apiKey: process.env.WEATHER_API_KEY || '',
      updateInterval: 900000, // 15 minutes
      timeout: 5000, // 5 seconds
      retryAttempts: 3
    });

    // Geopolitical data source
    this.addDataSource('geopolitical', {
      endpoint: process.env.GEOPOLITICAL_API_ENDPOINT || 'https://api.un.org/v1',
      apiKey: process.env.GEOPOLITICAL_API_KEY || '',
      updateInterval: 7200000, // 2 hours
      timeout: 15000, // 15 seconds
      retryAttempts: 3
    });

    this.isInitialized = true;
  }

  /**
   * Add a new data source
   */
  public addDataSource(name: string, config: DataSourceConfig): void {
    this.dataSources.set(name, config);
    this.startFetchInterval(name);
  }

  /**
   * Start periodic data fetching for a source
   */
  private startFetchInterval(sourceName: string): void {
    const config = this.dataSources.get(sourceName);
    if (!config) return;

    const interval = setInterval(async () => {
      await this.fetchData(sourceName);
    }, config.updateInterval);

    this.fetchIntervals.set(sourceName, interval);
  }

  /**
   * Fetch data from a specific source
   */
  private async fetchData(sourceName: string): Promise<DataFetchResult<any>> {
    const config = this.dataSources.get(sourceName);
    if (!config) {
      return {
        success: false,
        error: 'Data source not found',
        timestamp: new Date()
      };
    }

    let attempt = 0;
    while (attempt < config.retryAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.endpoint, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.cache.set(sourceName, {
          data,
          timestamp: new Date()
        });

        this.emit('dataUpdated', {
          source: sourceName,
          data,
          timestamp: new Date()
        });

        return {
          success: true,
          data,
          timestamp: new Date()
        };
      } catch (error) {
        attempt++;
        if (attempt === config.retryAttempts) {
          return {
            success: false,
            error: error.message,
            timestamp: new Date()
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Max retry attempts reached',
      timestamp: new Date()
    };
  }

  /**
   * Get cached data for a source
   */
  public getCachedData(sourceName: string): any {
    const cached = this.cache.get(sourceName);
    if (!cached) return null;

    const now = new Date().getTime();
    if (now - cached.timestamp.getTime() > this.cacheExpiry) {
      this.cache.delete(sourceName);
      return null;
    }

    return cached.data;
  }

  /**
   * Update world state based on real-world data
   */
  public async updateWorldState(currentState: WorldState): Promise<WorldState> {
    const economicData = await this.fetchEconomicIndicators();
    const weatherData = await this.fetchWeatherConditions();
    const geopoliticalData = await this.fetchGeopoliticalStatus();

    return {
      ...currentState,
      resourceAvailability: this.calculateResourceAvailability(economicData),
      weatherConditions: this.processWeatherConditions(weatherData),
      globalStability: this.calculateGlobalStability(geopoliticalData),
      aiActivity: {
        ...currentState.aiActivity,
        aggressionLevel: this.calculateAIAggression(economicData, geopoliticalData)
      }
    };
  }

  /**
   * Fetch economic indicators
   */
  private async fetchEconomicIndicators(): Promise<any> {
    const result = await this.fetchData('economic');
    if (!result.success) {
      return this.getCachedData('economic') || {};
    }
    return result.data;
  }

  /**
   * Fetch weather conditions
   */
  private async fetchWeatherConditions(): Promise<any> {
    const result = await this.fetchData('weather');
    if (!result.success) {
      return this.getCachedData('weather') || {};
    }
    return result.data;
  }

  /**
   * Fetch geopolitical status
   */
  private async fetchGeopoliticalStatus(): Promise<any> {
    const result = await this.fetchData('geopolitical');
    if (!result.success) {
      return this.getCachedData('geopolitical') || {};
    }
    return result.data;
  }

  /**
   * Calculate resource availability based on economic data
   */
  private calculateResourceAvailability(economicData: any): Record<ResourceType, number> {
    // Implementation would map real economic indicators to game resources
    return {
      [ResourceType.ENERGY]: this.normalizeValue(economicData.energyIndex || 0.5),
      [ResourceType.MATERIALS]: this.normalizeValue(economicData.materialsIndex || 0.5),
      [ResourceType.TECHNOLOGY]: this.normalizeValue(economicData.techIndex || 0.5),
      [ResourceType.INTELLIGENCE]: this.normalizeValue(economicData.educationIndex || 0.5),
      [ResourceType.MORALE]: this.normalizeValue(economicData.socialIndex || 0.5)
    };
  }

  /**
   * Process weather conditions into game format
   */
  private processWeatherConditions(weatherData: any): WeatherCondition[] {
    // Implementation would convert weather API data to game weather conditions
    return weatherData.conditions?.map(condition => ({
      type: this.mapWeatherType(condition.type),
      severity: this.normalizeValue(condition.severity),
      duration: condition.duration || 3600,
      effects: this.calculateWeatherEffects(condition)
    })) || [];
  }

  /**
   * Calculate global stability based on geopolitical data
   */
  private calculateGlobalStability(geopoliticalData: any): number {
    // Implementation would analyze various factors to determine stability
    const factors = [
      geopoliticalData.conflictIndex || 0.5,
      geopoliticalData.diplomaticRelations || 0.5,
      geopoliticalData.economicStability || 0.5
    ];

    return this.normalizeValue(
      factors.reduce((sum, factor) => sum + factor, 0) / factors.length
    );
  }

  /**
   * Calculate AI aggression level based on world data
   */
  private calculateAIAggression(economicData: any, geopoliticalData: any): number {
    const factors = [
      1 - (economicData.stabilityIndex || 0.5),
      1 - (geopoliticalData.peaceIndex || 0.5),
      economicData.volatilityIndex || 0.5
    ];

    return this.normalizeValue(
      factors.reduce((sum, factor) => sum + factor, 0) / factors.length
    );
  }

  /**
   * Normalize a value to 0-1 range
   */
  private normalizeValue(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Map weather type from API to game weather type
   */
  private mapWeatherType(apiWeatherType: string): string {
    // Implementation would map API weather types to game weather types
    const weatherMap = {
      'clear': 'CLEAR',
      'rain': 'STORMY',
      'extreme-heat': 'EXTREME_HEAT',
      'extreme-cold': 'EXTREME_COLD',
      'electromagnetic': 'ELECTROMAGNETIC_STORM'
    };

    return weatherMap[apiWeatherType] || 'CLEAR';
  }

  /**
   * Calculate weather effects on game mechanics
   */
  private calculateWeatherEffects(condition: any): any[] {
    // Implementation would determine game effects based on weather conditions
    return [];
  }

  /**
   * Stop all data fetching intervals
   */
  public stop(): void {
    for (const [sourceName, interval] of this.fetchIntervals) {
      clearInterval(interval);
      this.fetchIntervals.delete(sourceName);
    }
  }

  /**
   * Get the timestamp of the last successful update
   */
  public getLastUpdateTime(): Date {
    return this.lastUpdate;
  }

  /**
   * Check if all data sources are working correctly
   */
  public async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [sourceName] of this.dataSources) {
      const result = await this.fetchData(sourceName);
      health[sourceName] = result.success;
    }

    return health;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }
}