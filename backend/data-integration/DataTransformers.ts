import {
    ResourceType,
    GameEvent,
    WorldEventType,
    WeatherCondition,
    ResourceCost,
    AIActivityMetrics,
    WorldState,
    RegionId,
    PlayerId
  } from '../game-logic/types';
  
  interface DataTransformRule {
    sourceField: string;
    targetField: string;
    transform: (value: any) => any;
  }
  
  interface TransformationMetrics {
    processedCount: number;
    errorCount: number;
    lastProcessed: Date | null;
    averageProcessingTime: number;
  }
  
  export class DataTransformers {
    private transformRules: Map<string, DataTransformRule[]>;
    private metrics: Map<string, TransformationMetrics>;
    private readonly validationRules: Map<string, (data: any) => boolean>;
  
    constructor() {
      this.transformRules = new Map();
      this.metrics = new Map();
      this.validationRules = this.initializeValidationRules();
      this.initializeTransformRules();
    }
  
    /**
     * Initialize validation rules for different data types
     */
    private initializeValidationRules(): Map<string, (data: any) => boolean> {
      const rules = new Map<string, (data: any) => boolean>();
  
      rules.set('economic', (data: any) => {
        return data &&
          typeof data.gdpGrowth === 'number' &&
          typeof data.industrialProduction === 'number' &&
          typeof data.resourceScarcity === 'number';
      });
  
      rules.set('weather', (data: any) => {
        return data &&
          Array.isArray(data.conditions) &&
          data.temperature !== undefined;
      });
  
      rules.set('geopolitical', (data: any) => {
        return data &&
          typeof data.stabilityIndex === 'number' &&
          typeof data.conflictLevel === 'number';
      });
  
      return rules;
    }
  
    /**
     * Initialize transformation rules for different data types
     */
    private initializeTransformRules(): void {
      // Economic data transformations
      this.transformRules.set('economic', [
        {
          sourceField: 'gdpGrowth',
          targetField: 'resourceMultiplier',
          transform: (value: number) => this.normalizeValue(value, -10, 10, 0.5, 2)
        },
        {
          sourceField: 'industrialProduction',
          targetField: 'productionEfficiency',
          transform: (value: number) => this.normalizeValue(value, 0, 100, 0.8, 1.5)
        },
        {
          sourceField: 'resourceScarcity',
          targetField: 'resourceAvailability',
          transform: (value: number) => 1 - this.normalizeValue(value, 0, 100, 0, 1)
        }
      ]);
  
      // Weather data transformations
      this.transformRules.set('weather', [
        {
          sourceField: 'temperature',
          targetField: 'environmentalEffect',
          transform: (value: number) => this.calculateTemperatureEffect(value)
        },
        {
          sourceField: 'conditions',
          targetField: 'weatherConditions',
          transform: (conditions: any[]) => this.transformWeatherConditions(conditions)
        }
      ]);
  
      // Geopolitical data transformations
      this.transformRules.set('geopolitical', [
        {
          sourceField: 'stabilityIndex',
          targetField: 'globalStability',
          transform: (value: number) => this.normalizeValue(value, 0, 100, 0, 1)
        },
        {
          sourceField: 'conflictLevel',
          targetField: 'aiAggressionModifier',
          transform: (value: number) => this.normalizeValue(value, 0, 100, 1, 2)
        }
      ]);
  
      // Initialize metrics for each transform type
      ['economic', 'weather', 'geopolitical'].forEach(type => {
        this.metrics.set(type, {
          processedCount: 0,
          errorCount: 0,
          lastProcessed: null,
          averageProcessingTime: 0
        });
      });
    }
  
    /**
     * Transform economic data to game resources
     */
    public transformEconomicData(data: any): ResourceCost {
      const startTime = performance.now();
      const metrics = this.metrics.get('economic')!;
  
      try {
        if (!this.validateData('economic', data)) {
          throw new Error('Invalid economic data format');
        }
  
        const transformed = this.applyTransformRules('economic', data);
        const resources: ResourceCost = {
          energy: this.calculateResourceValue(transformed.resourceAvailability, 'energy', data),
          materials: this.calculateResourceValue(transformed.resourceAvailability, 'materials', data),
          technology: this.calculateResourceValue(transformed.resourceMultiplier, 'technology', data),
          intelligence: this.calculateResourceValue(transformed.productionEfficiency, 'intelligence', data),
          morale: this.calculateMoraleValue(data)
        };
  
        this.updateMetrics(metrics, startTime);
        return resources;
  
      } catch (error) {
        metrics.errorCount++;
        throw error;
      }
    }
  
    /**
     * Transform weather data to game conditions
     */
    public transformWeatherData(data: any): WeatherCondition[] {
      const startTime = performance.now();
      const metrics = this.metrics.get('weather')!;
  
      try {
        if (!this.validateData('weather', data)) {
          throw new Error('Invalid weather data format');
        }
  
        const transformed = this.applyTransformRules('weather', data);
        const conditions = transformed.weatherConditions.map((condition: any) => ({
          type: this.mapWeatherType(condition.type),
          severity: this.normalizeValue(condition.severity, 0, 100, 0, 1),
          duration: condition.duration || 3600,
          effects: this.calculateWeatherEffects(condition)
        }));
  
        this.updateMetrics(metrics, startTime);
        return conditions;
  
      } catch (error) {
        metrics.errorCount++;
        throw error;
      }
    }
  
    /**
     * Transform geopolitical data to world state modifiers
     */
    public transformGeopoliticalData(data: any): Partial<WorldState> {
      const startTime = performance.now();
      const metrics = this.metrics.get('geopolitical')!;
  
      try {
        if (!this.validateData('geopolitical', data)) {
          throw new Error('Invalid geopolitical data format');
        }
  
        const transformed = this.applyTransformRules('geopolitical', data);
        
        const worldState: Partial<WorldState> = {
          globalStability: transformed.globalStability,
          aiActivity: this.calculateAIActivity(transformed)
        };
  
        this.updateMetrics(metrics, startTime);
        return worldState;
  
      } catch (error) {
        metrics.errorCount++;
        throw error;
      }
    }
  
    /**
     * Apply transformation rules to data
     */
    private applyTransformRules(type: string, data: any): any {
      const rules = this.transformRules.get(type);
      if (!rules) return data;
  
      const result: any = {};
      for (const rule of rules) {
        const sourceValue = data[rule.sourceField];
        if (sourceValue !== undefined) {
          result[rule.targetField] = rule.transform(sourceValue);
        }
      }
      return result;
    }
  
    /**
     * Validate data against defined rules
     */
    private validateData(type: string, data: any): boolean {
      const validator = this.validationRules.get(type);
      return validator ? validator(data) : false;
    }
  
    /**
     * Update metrics after transformation
     */
    private updateMetrics(metrics: TransformationMetrics, startTime: number): void {
      const processingTime = performance.now() - startTime;
      metrics.processedCount++;
      metrics.lastProcessed = new Date();
      metrics.averageProcessingTime = 
        (metrics.averageProcessingTime * (metrics.processedCount - 1) + processingTime) / 
        metrics.processedCount;
    }
  
    /**
     * Calculate resource value based on various factors
     */
    private calculateResourceValue(
      baseValue: number,
      resourceType: string,
      data: any
    ): number {
      const scarcityFactor = data.resourceScarcity ? 
        1 - this.normalizeValue(data.resourceScarcity, 0, 100, 0, 0.5) : 1;
      const productionFactor = data.industrialProduction ?
        this.normalizeValue(data.industrialProduction, 0, 100, 0.8, 1.2) : 1;
  
      return Math.floor(100 * baseValue * scarcityFactor * productionFactor);
    }
  
    /**
     * Calculate morale value based on economic factors
     */
    private calculateMoraleValue(data: any): number {
      const factors = [
        data.gdpGrowth ? this.normalizeValue(data.gdpGrowth, -10, 10, 0.5, 1.5) : 1,
        data.employmentRate ? this.normalizeValue(data.employmentRate, 0, 100, 0.7, 1.3) : 1,
        data.socialStability ? this.normalizeValue(data.socialStability, 0, 100, 0.8, 1.2) : 1
      ];
  
      return Math.floor(100 * factors.reduce((acc, val) => acc * val, 1));
    }
  
    /**
     * Calculate AI activity metrics based on world state
     */
    private calculateAIActivity(transformed: any): AIActivityMetrics {
      return {
        aggressionLevel: transformed.aiAggressionModifier * (1 - transformed.globalStability),
        expansionRate: this.normalizeValue(1 - transformed.globalStability, 0, 1, 0.1, 0.5),
        techProgress: 0, // This would be calculated from game state
        targetedRegions: [], // This would be determined by AI strategy
        predictedNextActions: [] // This would be determined by AI behavior model
      };
    }
  
    /**
     * Map weather types to game weather conditions
     */
    private mapWeatherType(apiType: string): string {
      const weatherMap: { [key: string]: string } = {
        'sunny': 'CLEAR',
        'rain': 'STORMY',
        'heat_wave': 'EXTREME_HEAT',
        'blizzard': 'EXTREME_COLD',
        'electromagnetic_storm': 'ELECTROMAGNETIC_STORM'
      };
      return weatherMap[apiType] || 'CLEAR';
    }
  
    /**
     * Calculate weather effects on game mechanics
     */
    private calculateWeatherEffects(condition: any): any[] {
      const effects = [];
      const severity = this.normalizeValue(condition.severity, 0, 100, 0, 1);
  
      switch (condition.type) {
        case 'heat_wave':
          effects.push({
            target: 'energy',
            modifier: -0.2 * severity
          });
          break;
        case 'electromagnetic_storm':
          effects.push({
            target: 'technology',
            modifier: -0.3 * severity
          });
          break;
        // Add more weather effect calculations
      }
  
      return effects;
    }
  
    /**
     * Normalize a value to a specified range
     */
    private normalizeValue(
      value: number,
      minInput: number,
      maxInput: number,
      minOutput: number,
      maxOutput: number
    ): number {
      const normalizedValue = (value - minInput) / (maxInput - minInput);
      return minOutput + normalizedValue * (maxOutput - minOutput);
    }
  
    /**
     * Get transformation metrics
     */
    public getMetrics(): Map<string, TransformationMetrics> {
      return new Map(this.metrics);
    }
  
    /**
     * Add custom transformation rule
     */
    public addTransformRule(
      type: string,
      rule: DataTransformRule
    ): void {
      const rules = this.transformRules.get(type) || [];
      rules.push(rule);
      this.transformRules.set(type, rules);
    }
  
    /**
     * Add custom validation rule
     */
    public addValidationRule(
      type: string,
      validator: (data: any) => boolean
    ): void {
      this.validationRules.set(type, validator);
    }
  
    /**
     * Reset metrics
     */
    public resetMetrics(): void {
      this.metrics.forEach((metric) => {
        metric.processedCount = 0;
        metric.errorCount = 0;
        metric.lastProcessed = null;
        metric.averageProcessingTime = 0;
      });
    }
  }