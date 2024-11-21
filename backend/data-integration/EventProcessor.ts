import { EventEmitter } from 'events';
import {
  GameEvent,
  WorldEventType,
  GameEventType,
  EventVisibility,
  PlayerId,
  RegionId,
  ResourceCost,
  CombatResult,
  WorldState
} from '../game-logic/types';

interface EventProcessorConfig {
  maxQueueSize: number;
  processingInterval: number;
  maxRetries: number;
  batchSize: number;
}

interface EventPriority {
  type: GameEventType | WorldEventType;
  priority: number;
  processingDelay: number;
}

interface ProcessedEvent extends GameEvent {
  processedAt: Date;
  attempts: number;
  effects: EventEffect[];
}

interface EventEffect {
  type: 'resource' | 'combat' | 'territory' | 'status';
  target: PlayerId | RegionId | 'global';
  changes: any;
  magnitude: number;
}

export class EventProcessor extends EventEmitter {
  private eventQueue: GameEvent[];
  private processedEvents: ProcessedEvent[];
  private processingInterval: NodeJS.Timeout | null;
  private readonly config: EventProcessorConfig;
  private readonly priorityMap: Map<string, EventPriority>;
  private isProcessing: boolean;
  private worldState: WorldState;

  constructor(config: Partial<EventProcessorConfig> = {}) {
    super();
    this.eventQueue = [];
    this.processedEvents = [];
    this.isProcessing = false;
    this.config = {
      maxQueueSize: config.maxQueueSize || 1000,
      processingInterval: config.processingInterval || 100,
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 10
    };
    this.priorityMap = this.initializePriorityMap();
  }

  /**
   * Initialize event priority mappings
   */
  private initializePriorityMap(): Map<string, EventPriority> {
    const map = new Map<string, EventPriority>();

    // Combat events - highest priority
    map.set(GameEventType.COMBAT_RESULT, {
      type: GameEventType.COMBAT_RESULT,
      priority: 1,
      processingDelay: 0
    });

    // World events - high priority
    map.set(WorldEventType.AI_UPRISING, {
      type: WorldEventType.AI_UPRISING,
      priority: 2,
      processingDelay: 0
    });
    map.set(WorldEventType.NATURAL_DISASTER, {
      type: WorldEventType.NATURAL_DISASTER,
      priority: 2,
      processingDelay: 0
    });

    // Resource events - medium priority
    map.set(GameEventType.RESOURCE_CHANGE, {
      type: GameEventType.RESOURCE_CHANGE,
      priority: 3,
      processingDelay: 100
    });

    // Territory events - medium priority
    map.set(GameEventType.TERRITORY_CHANGE, {
      type: GameEventType.TERRITORY_CHANGE,
      priority: 3,
      processingDelay: 100
    });

    // Player actions - normal priority
    map.set(GameEventType.PLAYER_ACTION, {
      type: GameEventType.PLAYER_ACTION,
      priority: 4,
      processingDelay: 200
    });

    // AI actions - normal priority
    map.set(GameEventType.AI_ACTION, {
      type: GameEventType.AI_ACTION,
      priority: 4,
      processingDelay: 200
    });

    return map;
  }

  /**
   * Start the event processing pipeline
   */
  public start(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(
      () => this.processEventBatch(),
      this.config.processingInterval
    );
  }

  /**
   * Stop the event processing pipeline
   */
  public stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Queue a new event for processing
   */
  public queueEvent(event: GameEvent): boolean {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      this.emit('queueFull', event);
      return false;
    }

    this.eventQueue.push(event);
    this.sortEventQueue();
    this.emit('eventQueued', event);
    return true;
  }

  /**
   * Sort event queue based on priority
   */
  private sortEventQueue(): void {
    this.eventQueue.sort((a, b) => {
      const priorityA = this.priorityMap.get(a.type)?.priority || 5;
      const priorityB = this.priorityMap.get(b.type)?.priority || 5;
      return priorityA - priorityB;
    });
  }

  /**
   * Process a batch of events
   */
  private async processEventBatch(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.eventQueue.splice(0, this.config.batchSize);

    try {
      for (const event of batch) {
        const processedEvent = await this.processEvent(event);
        if (processedEvent) {
          this.processedEvents.push(processedEvent);
          this.emit('eventProcessed', processedEvent);
        }
      }
    } catch (error) {
      this.emit('processingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: GameEvent): Promise<ProcessedEvent | null> {
    const priority = this.priorityMap.get(event.type);
    if (!priority) return null;

    // Apply processing delay if specified
    if (priority.processingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, priority.processingDelay));
    }

    const effects = await this.calculateEventEffects(event);
    const processedEvent: ProcessedEvent = {
      ...event,
      processedAt: new Date(),
      attempts: 1,
      effects
    };

    try {
      await this.applyEventEffects(processedEvent);
      return processedEvent;
    } catch (error) {
      if (processedEvent.attempts < this.config.maxRetries) {
        this.eventQueue.unshift({ ...event });
      } else {
        this.emit('eventFailed', { event, error });
      }
      return null;
    }
  }

  /**
   * Calculate effects for an event
   */
  private async calculateEventEffects(event: GameEvent): Promise<EventEffect[]> {
    const effects: EventEffect[] = [];

    switch (event.type) {
      case GameEventType.COMBAT_RESULT:
        effects.push(...this.calculateCombatEffects(event.data as CombatResult));
        break;

      case GameEventType.RESOURCE_CHANGE:
        effects.push(this.calculateResourceEffect(event.data as ResourceCost, event.playerId!));
        break;

      case GameEventType.TERRITORY_CHANGE:
        effects.push(this.calculateTerritoryEffect(event.data as any));
        break;

      case WorldEventType.NATURAL_DISASTER:
      case WorldEventType.AI_UPRISING:
        effects.push(...this.calculateWorldEventEffects(event));
        break;
    }

    return effects;
  }

  /**
   * Calculate combat event effects
   */
  private calculateCombatEffects(combat: CombatResult): EventEffect[] {
    const effects: EventEffect[] = [];

    // Territory control effect
    if (combat.territoryChanged) {
      effects.push({
        type: 'territory',
        target: combat.regionId,
        changes: {
          controller: combat.attackerId,
          previousController: combat.defenderId
        },
        magnitude: 1
      });
    }

    // Unit losses effect
    effects.push({
      type: 'combat',
      target: combat.attackerId,
      changes: {
        units: combat.units.filter(u => u.destroyed)
      },
      magnitude: combat.units.filter(u => u.destroyed).length
    });

    return effects;
  }

  /**
   * Calculate resource change effects
   */
  private calculateResourceEffect(resources: ResourceCost, playerId: PlayerId): EventEffect {
    return {
      type: 'resource',
      target: playerId,
      changes: resources,
      magnitude: Object.values(resources).reduce((sum, val) => sum + Math.abs(val), 0)
    };
  }

  /**
   * Calculate territory change effects
   */
  private calculateTerritoryEffect(data: any): EventEffect {
    return {
      type: 'territory',
      target: data.regionId,
      changes: {
        controller: data.newController,
        previousController: data.previousController
      },
      magnitude: 1
    };
  }

  /**
   * Calculate world event effects
   */
  private calculateWorldEventEffects(event: GameEvent): EventEffect[] {
    const effects: EventEffect[] = [];
    const data = event.data as any;

    // Global status effect
    effects.push({
      type: 'status',
      target: 'global',
      changes: {
        eventType: event.type,
        severity: data.severity || 1
      },
      magnitude: data.severity || 1
    });

    // Region-specific effects
    if (data.affectedRegions) {
      data.affectedRegions.forEach((regionId: RegionId) => {
        effects.push({
          type: 'status',
          target: regionId,
          changes: {
            eventType: event.type,
            severity: data.severity || 1
          },
          magnitude: data.severity || 1
        });
      });
    }

    return effects;
  }

  /**
   * Apply calculated effects to game state
   */
  private async applyEventEffects(event: ProcessedEvent): Promise<void> {
    for (const effect of event.effects) {
      switch (effect.type) {
        case 'resource':
          await this.applyResourceEffect(effect);
          break;
        case 'combat':
          await this.applyCombatEffect(effect);
          break;
        case 'territory':
          await this.applyTerritoryEffect(effect);
          break;
        case 'status':
          await this.applyStatusEffect(effect);
          break;
      }
    }
  }

  /**
   * Apply resource effects
   */
  private async applyResourceEffect(effect: EventEffect): Promise<void> {
    // Implementation would update player resources
    this.emit('resourcesUpdated', effect);
  }

  /**
   * Apply combat effects
   */
  private async applyCombatEffect(effect: EventEffect): Promise<void> {
    // Implementation would update unit states and combat results
    this.emit('combatResolved', effect);
  }

  /**
   * Apply territory effects
   */
  private async applyTerritoryEffect(effect: EventEffect): Promise<void> {
    // Implementation would update territory control
    this.emit('territoryChanged', effect);
  }

  /**
   * Apply status effects
   */
  private async applyStatusEffect(effect: EventEffect): Promise<void> {
    // Implementation would update global or region-specific status
    this.emit('statusUpdated', effect);
  }

  /**
   * Get current event queue status
   */
  public getQueueStatus(): {
    queueLength: number;
    processedCount: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.eventQueue.length,
      processedCount: this.processedEvents.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear processed events history
   */
  public clearHistory(): void {
    this.processedEvents = [];
    this.emit('historyCleared');
  }

  /**
   * Get processed events for a specific target
   */
  public getProcessedEventsForTarget(
    target: PlayerId | RegionId,
    limit: number = 10
  ): ProcessedEvent[] {
    return this.processedEvents
      .filter(event => 
        event.effects.some(effect => effect.target === target)
      )
      .slice(-limit);
  }
}