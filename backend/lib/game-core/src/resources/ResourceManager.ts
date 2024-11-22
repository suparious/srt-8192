import { EventEmitter } from 'events';
import {
  PlayerId,
  RegionId,
  ResourceType,
  ResourceCost,
  ResourceMultipliers,
  Resources,
  ServerRegion,
  ServerPlayer,
  WorldState,
  GameEventType,
  EventVisibility
} from './types';

interface ResourceTransaction {
  id: string;
  timestamp: Date;
  sourceId: PlayerId | 'SYSTEM';
  targetId: PlayerId;
  resources: Partial<ResourceCost>;
  type: 'ALLOCATION' | 'TRADE' | 'PRODUCTION' | 'MAINTENANCE' | 'PENALTY';
}

interface ProductionConfig {
  baseRate: number;
  efficiencyMultiplier: number;
  populationMultiplier: number;
  climateEffect: number;
}

export class ResourceManager extends EventEmitter {
  private transactions: ResourceTransaction[];
  private productionConfigs: Map<ResourceType, ProductionConfig>;
  private maintenanceCosts: Map<string, ResourceCost>;
  private tradingEnabled: boolean;
  private maxStorageCapacity: ResourceCost;

  constructor() {
    super();
    this.transactions = [];
    this.productionConfigs = this.initializeProductionConfigs();
    this.maintenanceCosts = new Map();
    this.tradingEnabled = true;
    this.maxStorageCapacity = {
      energy: 10000,
      materials: 10000,
      technology: 5000,
      intelligence: 2000,
      morale: 1000
    };
  }

  /**
   * Initialize production configuration for each resource type
   */
  private initializeProductionConfigs(): Map<ResourceType, ProductionConfig> {
    const configs = new Map<ResourceType, ProductionConfig>();
    
    configs.set(ResourceType.ENERGY, {
      baseRate: 100,
      efficiencyMultiplier: 1.0,
      populationMultiplier: 0.5,
      climateEffect: 1.0
    });

    configs.set(ResourceType.MATERIALS, {
      baseRate: 80,
      efficiencyMultiplier: 1.0,
      populationMultiplier: 0.8,
      climateEffect: 0.7
    });

    configs.set(ResourceType.TECHNOLOGY, {
      baseRate: 40,
      efficiencyMultiplier: 1.2,
      populationMultiplier: 0.3,
      climateEffect: 0.5
    });

    configs.set(ResourceType.INTELLIGENCE, {
      baseRate: 20,
      efficiencyMultiplier: 1.5,
      populationMultiplier: 0.2,
      climateEffect: 0.3
    });

    configs.set(ResourceType.MORALE, {
      baseRate: 50,
      efficiencyMultiplier: 0.8,
      populationMultiplier: 1.0,
      climateEffect: 0.6
    });

    return configs;
  }

  /**
   * Calculate resource production for a region
   */
  public calculateRegionProduction(
    region: ServerRegion,
    worldState: WorldState
  ): ResourceCost {
    const production: ResourceCost = {
      energy: 0,
      materials: 0,
      technology: 0,
      intelligence: 0,
      morale: 0
    };

    for (const [resourceType, config] of this.productionConfigs) {
      const baseProduction = region.resources[resourceType] * config.baseRate;
      const efficiency = region.productionCapacity * config.efficiencyMultiplier;
      const population = Math.log10(region.population + 1) * config.populationMultiplier;
      const climate = this.calculateClimateEffect(worldState, config.climateEffect);
      
      production[resourceType] = Math.floor(
        baseProduction * efficiency * (1 + population) * climate
      );
    }

    return production;
  }

  /**
   * Calculate climate effect on resource production
   */
  private calculateClimateEffect(worldState: WorldState, baseEffect: number): number {
    const temperatureEffect = 1 - Math.abs(worldState.temperature - 20) / 100;
    const weatherEffect = worldState.weatherConditions.reduce((effect, condition) => {
      return effect * (1 - condition.severity * 0.2);
    }, 1);

    return 1 + (temperatureEffect * weatherEffect - 1) * baseEffect;
  }

  /**
   * Distribute resources to a player
   */
  public distributeResources(
    player: ServerPlayer,
    resources: Partial<ResourceCost>,
    type: ResourceTransaction['type'] = 'ALLOCATION'
  ): boolean {
    const transaction: ResourceTransaction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sourceId: 'SYSTEM',
      targetId: player.id,
      resources,
      type
    };

    const updatedResources = this.calculateUpdatedResources(
      player.gameState.resources,
      resources
    );

    if (this.validateResourceLimits(updatedResources)) {
      player.gameState.resources = updatedResources;
      this.transactions.push(transaction);
      this.emit('resourcesDistributed', { playerId: player.id, resources });
      return true;
    }

    return false;
  }

  /**
   * Execute a resource trade between players
   */
  public executeResourceTrade(
    source: ServerPlayer,
    target: ServerPlayer,
    offered: Partial<ResourceCost>,
    requested: Partial<ResourceCost>
  ): boolean {
    if (!this.tradingEnabled) {
      return false;
    }

    // Validate source has enough resources
    if (!this.hasEnoughResources(source.gameState.resources, offered)) {
      return false;
    }

    // Validate target has enough resources
    if (!this.hasEnoughResources(target.gameState.resources, requested)) {
      return false;
    }

    // Execute the trade
    const sourceUpdated = this.calculateUpdatedResources(
      source.gameState.resources,
      this.negateResources(offered)
    );
    const targetUpdated = this.calculateUpdatedResources(
      target.gameState.resources,
      this.negateResources(requested)
    );

    if (
      this.validateResourceLimits(sourceUpdated) &&
      this.validateResourceLimits(targetUpdated)
    ) {
      const tradeTransaction: ResourceTransaction = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        sourceId: source.id,
        targetId: target.id,
        resources: offered,
        type: 'TRADE'
      };

      source.gameState.resources = sourceUpdated;
      target.gameState.resources = targetUpdated;
      this.transactions.push(tradeTransaction);
      
      this.emit('tradeConducted', {
        sourceId: source.id,
        targetId: target.id,
        offered,
        requested
      });

      return true;
    }

    return false;
  }

  /**
   * Apply maintenance costs to player resources
   */
  public applyMaintenanceCosts(player: ServerPlayer): void {
    let totalCosts: ResourceCost = {
      energy: 0,
      materials: 0,
      technology: 0,
      intelligence: 0,
      morale: 0
    };

    // Calculate total maintenance costs
    for (const [structureId, cost] of this.maintenanceCosts) {
      if (player.gameState.structures?.includes(structureId)) {
        totalCosts = this.addResources(totalCosts, cost);
      }
    }

    const transaction: ResourceTransaction = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sourceId: player.id,
      targetId: player.id,
      resources: totalCosts,
      type: 'MAINTENANCE'
    };

    const updatedResources = this.calculateUpdatedResources(
      player.gameState.resources,
      this.negateResources(totalCosts)
    );

    player.gameState.resources = updatedResources;
    this.transactions.push(transaction);
    
    this.emit('maintenanceApplied', {
      playerId: player.id,
      costs: totalCosts
    });
  }

  /**
   * Calculate updated resources after a transaction
   */
  private calculateUpdatedResources(
    current: ResourceCost,
    changes: Partial<ResourceCost>
  ): ResourceCost {
    const updated = { ...current };

    for (const [resource, amount] of Object.entries(changes)) {
      updated[resource] = Math.max(0, current[resource] + amount);
    }

    return updated;
  }

  /**
   * Validate resource limits
   */
  private validateResourceLimits(resources: ResourceCost): boolean {
    return Object.entries(resources).every(
      ([resource, amount]) =>
        amount >= 0 && amount <= this.maxStorageCapacity[resource]
    );
  }

  /**
   * Check if player has enough resources
   */
  private hasEnoughResources(
    current: ResourceCost,
    required: Partial<ResourceCost>
  ): boolean {
    return Object.entries(required).every(
      ([resource, amount]) => current[resource] >= amount
    );
  }

  /**
   * Negate resource values for subtraction
   */
  private negateResources(resources: Partial<ResourceCost>): Partial<ResourceCost> {
    const negated: Partial<ResourceCost> = {};
    for (const [resource, amount] of Object.entries(resources)) {
      negated[resource] = -amount;
    }
    return negated;
  }

  /**
   * Add two resource objects together
   */
  private addResources(a: ResourceCost, b: ResourceCost): ResourceCost {
    return {
      energy: a.energy + b.energy,
      materials: a.materials + b.materials,
      technology: a.technology + b.technology,
      intelligence: a.intelligence + b.intelligence,
      morale: a.morale + b.morale
    };
  }

  /**
   * Get resource statistics for analytics
   */
  public getResourceStatistics(): {
    totalProduced: ResourceCost;
    totalConsumed: ResourceCost;
    averagePerPlayer: ResourceCost;
  } {
    return {
      totalProduced: this.calculateTotalProduced(),
      totalConsumed: this.calculateTotalConsumed(),
      averagePerPlayer: this.calculateAveragePerPlayer()
    };
  }

  /**
   * Calculate total resources produced
   */
  private calculateTotalProduced(): ResourceCost {
    return this.transactions
      .filter(t => t.type === 'PRODUCTION')
      .reduce(
        (total, t) => this.addResources(total, t.resources as ResourceCost),
        {
          energy: 0,
          materials: 0,
          technology: 0,
          intelligence: 0,
          morale: 0
        }
      );
  }

  /**
   * Calculate total resources consumed
   */
  private calculateTotalConsumed(): ResourceCost {
    return this.transactions
      .filter(t => t.type === 'MAINTENANCE')
      .reduce(
        (total, t) => this.addResources(total, t.resources as ResourceCost),
        {
          energy: 0,
          materials: 0,
          technology: 0,
          intelligence: 0,
          morale: 0
        }
      );
  }

  /**
   * Calculate average resources per player
   */
  private calculateAveragePerPlayer(): ResourceCost {
    const playerCounts = new Map<PlayerId, number>();
    const playerTotals: ResourceCost = {
      energy: 0,
      materials: 0,
      technology: 0,
      intelligence: 0,
      morale: 0
    };

    this.transactions.forEach(t => {
      if (t.targetId !== 'SYSTEM') {
        playerCounts.set(t.targetId, (playerCounts.get(t.targetId) || 0) + 1);
        playerTotals[t.targetId] = this.addResources(
          playerTotals[t.targetId] || {
            energy: 0,
            materials: 0,
            technology: 0,
            intelligence: 0,
            morale: 0
          },
          t.resources as ResourceCost
        );
      }
    });

    const playerCount = playerCounts.size;
    return {
      energy: Math.floor(playerTotals.energy / playerCount),
      materials: Math.floor(playerTotals.materials / playerCount),
      technology: Math.floor(playerTotals.technology / playerCount),
      intelligence: Math.floor(playerTotals.intelligence / playerCount),
      morale: Math.floor(playerTotals.morale / playerCount)
    };
  }

  /**
   * Update storage capacity limits
   */
  public updateStorageCapacity(newCapacity: Partial<ResourceCost>): void {
    this.maxStorageCapacity = {
      ...this.maxStorageCapacity,
      ...newCapacity
    };
    this.emit('storageCapacityUpdated', this.maxStorageCapacity);
  }

  /**
   * Enable or disable trading
   */
  public setTradingEnabled(enabled: boolean): void {
    this.tradingEnabled = enabled;
    this.emit('tradingStatusChanged', enabled);
  }

  /**
   * Clean up old transactions
   */
  public cleanupOldTransactions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAge);
    this.transactions = this.transactions.filter(
      t => t.timestamp > cutoffTime
    );
  }
}