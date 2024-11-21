import { EventEmitter } from 'events';
import {
  WorldState,
  WorldEvent,
  WorldEventType,
  WeatherCondition,
  EnvironmentalData,
  AIActivityMetrics,
  RegionId,
  ResourceType,
  GameEvent,
  GameEventType,
  EventVisibility
} from './types';

interface WorldStateConfig {
  updateInterval: number;
  minStability: number;
  maxStability: number;
  baseTemperature: number;
  temperatureVariance: number;
  eventProbability: number;
}

export class WorldStateManager extends EventEmitter {
  private currentState: WorldState;
  private updateInterval: NodeJS.Timeout | null;
  private readonly config: WorldStateConfig;
  private activeEventTimers: Map<string, NodeJS.Timeout>;

  constructor(config?: Partial<WorldStateConfig>) {
    super();
    this.config = {
      updateInterval: 60000, // 1 minute
      minStability: 0.2,
      maxStability: 1.0,
      baseTemperature: 20,
      temperatureVariance: 10,
      eventProbability: 0.1,
      ...config
    };
    this.currentState = this.initializeWorldState();
    this.activeEventTimers = new Map();
  }

  /**
   * Initialize world state with default values
   */
  private initializeWorldState(): WorldState {
    return {
      globalStability: this.config.maxStability,
      resourceAvailability: {
        [ResourceType.ENERGY]: 1.0,
        [ResourceType.MATERIALS]: 1.0,
        [ResourceType.TECHNOLOGY]: 1.0,
        [ResourceType.INTELLIGENCE]: 1.0,
        [ResourceType.MORALE]: 1.0
      },
      activeEvents: [],
      aiActivity: {
        aggressionLevel: 0.5,
        expansionRate: 0.1,
        techProgress: 0,
        targetedRegions: [],
        predictedNextActions: []
      },
      temperature: this.config.baseTemperature,
      weatherConditions: []
    };
  }

  /**
   * Start world state updates
   */
  public start(): void {
    if (!this.updateInterval) {
      this.updateInterval = setInterval(
        () => this.updateWorldState(),
        this.config.updateInterval
      );
      this.emit('worldStateStarted', this.currentState);
    }
  }

  /**
   * Stop world state updates
   */
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.emit('worldStateStopped');
    }
  }

  /**
   * Update world state
   */
  private updateWorldState(): void {
    // Update environmental conditions
    this.updateEnvironmentalConditions();

    // Check for new world events
    this.checkForWorldEvents();

    // Update resource availability
    this.updateResourceAvailability();

    // Update AI metrics
    this.updateAIMetrics();

    // Emit updated state
    this.emit('worldStateUpdated', this.currentState);
  }

  /**
   * Update environmental conditions
   */
  private updateEnvironmentalConditions(): void {
    // Update temperature with random fluctuation
    const temperatureChange = (Math.random() - 0.5) * 2;
    this.currentState.temperature = Math.max(
      -10,
      Math.min(
        50,
        this.currentState.temperature + temperatureChange
      )
    );

    // Update weather conditions
    this.updateWeatherConditions();
  }

  /**
   * Update weather conditions
   */
  private updateWeatherConditions(): void {
    // Remove expired weather conditions
    this.currentState.weatherConditions = this.currentState.weatherConditions
      .filter(condition => condition.duration > 0);

    // Random chance to add new weather condition
    if (Math.random() < 0.2) {
      const newCondition = this.generateWeatherCondition();
      this.currentState.weatherConditions.push(newCondition);

      this.emit('weatherConditionAdded', newCondition);
    }

    // Update durations
    this.currentState.weatherConditions.forEach(condition => {
      condition.duration -= this.config.updateInterval / 1000;
    });
  }

  /**
   * Generate a new weather condition
   */
  private generateWeatherCondition(): WeatherCondition {
    const conditions = [
      { type: 'CLEAR', maxSeverity: 0.2 },
      { type: 'STORMY', maxSeverity: 0.7 },
      { type: 'EXTREME_HEAT', maxSeverity: 0.9 },
      { type: 'EXTREME_COLD', maxSeverity: 0.9 },
      { type: 'ELECTROMAGNETIC_STORM', maxSeverity: 1.0 }
    ];

    const selected = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      type: selected.type,
      severity: Math.random() * selected.maxSeverity,
      duration: 1800 + Math.random() * 3600, // 30-90 minutes
      effects: this.generateWeatherEffects(selected.type)
    };
  }

  /**
   * Generate effects for weather condition
   */
  private generateWeatherEffects(weatherType: string): any[] {
    const effects = [];
    const baseEffect = Math.random() * 0.3 + 0.1; // 0.1 to 0.4

    switch (weatherType) {
      case 'STORMY':
        effects.push({
          target: 'movement',
          modifier: -baseEffect,
          duration: 3600
        });
        break;
      case 'EXTREME_HEAT':
        effects.push({
          target: 'energy',
          modifier: -baseEffect * 1.5,
          duration: 3600
        });
        break;
      case 'ELECTROMAGNETIC_STORM':
        effects.push({
          target: 'technology',
          modifier: -baseEffect * 2,
          duration: 1800
        });
        break;
    }

    return effects;
  }

  /**
   * Check for new world events
   */
  private checkForWorldEvents(): void {
    if (Math.random() < this.config.eventProbability) {
      const eventType = this.selectWorldEvent();
      this.triggerWorldEvent(eventType);
    }
  }

  /**
   * Select a world event based on current conditions
   */
  private selectWorldEvent(): WorldEventType {
    const stability = this.currentState.globalStability;
    const events: [WorldEventType, number][] = [
      [WorldEventType.NATURAL_DISASTER, 0.2],
      [WorldEventType.ECONOMIC_CRISIS, 0.3],
      [WorldEventType.TECHNOLOGICAL_BREAKTHROUGH, 0.2],
      [WorldEventType.SOCIAL_UNREST, 0.2],
      [WorldEventType.AI_UPRISING, 0.1]
    ];

    // Adjust probabilities based on stability
    const adjustedEvents = events.map(([event, prob]) => {
      let adjustedProb = prob;
      if (stability < 0.3) {
        adjustedProb *= 1.5; // More likely during instability
      }
      return [event, adjustedProb] as [WorldEventType, number];
    });

    // Normalize probabilities
    const total = adjustedEvents.reduce((sum, [_, prob]) => sum + prob, 0);
    const normalized = adjustedEvents.map(([event, prob]) => 
      [event, prob / total] as [WorldEventType, number]
    );

    // Select event
    const rand = Math.random();
    let cumulative = 0;
    for (const [event, prob] of normalized) {
      cumulative += prob;
      if (rand <= cumulative) {
        return event;
      }
    }

    return WorldEventType.NATURAL_DISASTER; // Fallback
  }

  /**
   * Trigger a world event
   */
  private triggerWorldEvent(eventType: WorldEventType): void {
    const event: WorldEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      severity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      affectedRegions: this.selectAffectedRegions(),
      duration: 1800 + Math.random() * 3600, // 30-90 minutes
      effects: []
    };

    this.currentState.activeEvents.push(event);
    
    // Set up timer to end event
    const timer = setTimeout(() => {
      this.endWorldEvent(event.id);
    }, event.duration * 1000);
    
    this.activeEventTimers.set(event.id, timer);

    // Apply immediate effects
    this.applyEventEffects(event);

    // Emit event
    this.emit('worldEventTriggered', event);

    // Log event
    this.emitGameEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.WORLD_EVENT,
      data: { event },
      visibility: EventVisibility.PUBLIC
    });
  }

  /**
   * End a world event
   */
  private endWorldEvent(eventId: string): void {
    const eventIndex = this.currentState.activeEvents
      .findIndex(e => e.id === eventId);
    
    if (eventIndex >= 0) {
      const event = this.currentState.activeEvents[eventIndex];
      this.currentState.activeEvents.splice(eventIndex, 1);
      
      // Clear timer
      const timer = this.activeEventTimers.get(eventId);
      if (timer) {
        clearTimeout(timer);
        this.activeEventTimers.delete(eventId);
      }

      // Revert event effects
      this.revertEventEffects(event);

      this.emit('worldEventEnded', event);
    }
  }

  /**
   * Select regions affected by an event
   */
  private selectAffectedRegions(): RegionId[] {
    // Implementation would select regions based on proximity and other factors
    // This is a placeholder that returns random regions
    return ['region-1', 'region-2'] as RegionId[];
  }

  /**
   * Apply effects of a world event
   */
  private applyEventEffects(event: WorldEvent): void {
    switch (event.type) {
      case WorldEventType.NATURAL_DISASTER:
        this.modifyResourceAvailability({
          [ResourceType.MATERIALS]: -0.2,
          [ResourceType.ENERGY]: -0.1
        });
        break;

      case WorldEventType.ECONOMIC_CRISIS:
        this.modifyResourceAvailability({
          [ResourceType.MATERIALS]: -0.3,
          [ResourceType.TECHNOLOGY]: -0.2,
          [ResourceType.MORALE]: -0.2
        });
        break;

      case WorldEventType.TECHNOLOGICAL_BREAKTHROUGH:
        this.modifyResourceAvailability({
          [ResourceType.TECHNOLOGY]: 0.3,
          [ResourceType.INTELLIGENCE]: 0.2
        });
        break;

      case WorldEventType.SOCIAL_UNREST:
        this.modifyResourceAvailability({
          [ResourceType.MORALE]: -0.3,
          [ResourceType.INTELLIGENCE]: -0.1
        });
        break;

      case WorldEventType.AI_UPRISING:
        this.updateAIMetrics({
          aggressionLevel: Math.min(1, this.currentState.aiActivity.aggressionLevel * 1.5),
          expansionRate: Math.min(1, this.currentState.aiActivity.expansionRate * 1.3)
        });
        break;
    }
  }

  /**
   * Revert effects of a world event
   */
  private revertEventEffects(event: WorldEvent): void {
    switch (event.type) {
      case WorldEventType.NATURAL_DISASTER:
        this.modifyResourceAvailability({
          [ResourceType.MATERIALS]: 0.1,
          [ResourceType.ENERGY]: 0.05
        });
        break;

      case WorldEventType.ECONOMIC_CRISIS:
        this.modifyResourceAvailability({
          [ResourceType.MATERIALS]: 0.15,
          [ResourceType.TECHNOLOGY]: 0.1,
          [ResourceType.MORALE]: 0.1
        });
        break;

      // Add other event type reversions as needed
    }
  }

  /**
   * Update resource availability
   */
  private updateResourceAvailability(): void {
    Object.keys(this.currentState.resourceAvailability).forEach(resource => {
      const currentValue = this.currentState.resourceAvailability[resource];
      const change = (Math.random() - 0.5) * 0.1; // -0.05 to 0.05
      this.currentState.resourceAvailability[resource] = Math.max(
        0.1,
        Math.min(1, currentValue + change)
      );
    });
  }

  /**
   * Modify resource availability
   */
  private modifyResourceAvailability(changes: Partial<Record<ResourceType, number>>): void {
    Object.entries(changes).forEach(([resource, change]) => {
      const currentValue = this.currentState.resourceAvailability[resource];
      this.currentState.resourceAvailability[resource] = Math.max(
        0.1,
        Math.min(1, currentValue + change)
      );
    });
  }

  /**
   * Update AI metrics
   */
  private updateAIMetrics(partialMetrics?: Partial<AIActivityMetrics>): void {
    if (partialMetrics) {
      this.currentState.aiActivity = {
        ...this.currentState.aiActivity,
        ...partialMetrics
      };
    } else {
      // Gradual changes based on world state
      const stability = this.currentState.globalStability;
      const aggressionChange = (1 - stability) * 0.1;
      
      this.currentState.aiActivity.aggressionLevel = Math.min(
        1,
        this.currentState.aiActivity.aggressionLevel + aggressionChange
      );
    }
  }

  /**
   * Get current world state
   */
  public getWorldState(): Readonly<WorldState> {
    return Object.freeze({ ...this.currentState });
  }

  /**
   * Emit game event
   */
  private emitGameEvent(event: GameEvent): void {
    this.emit('gameEvent', event);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.activeEventTimers.forEach(timer => clearTimeout(timer));
    this.activeEventTimers.clear();
  }
}