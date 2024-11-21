import { EventEmitter } from 'events';
import {
  PlayerId,
  GameState,
  ActionType,
  QueuedAction,
  RegionId,
  ResourceCost,
  AIActivityMetrics,
  WorldEventType,
  PredictedAction,
  ServerRegion,
  UnitType,
  WorldState
} from '../game-logic/types';

interface AIStrategyWeight {
  expansion: number;
  defense: number;
  offense: number;
  economy: number;
  technology: number;
}

interface RegionThreatLevel {
  regionId: RegionId;
  threatScore: number;
  strategicValue: number;
  resourceValue: number;
}

export class OpponentAI extends EventEmitter {
  private gameState: GameState;
  private strategyWeights: AIStrategyWeight;
  private threatMap: Map<RegionId, RegionThreatLevel>;
  private lastActionTime: number;
  private readonly baseAggressionLevel: number = 0.5;
  private readonly learningRate: number = 0.1;

  constructor(gameState: GameState) {
    super();
    this.gameState = gameState;
    this.strategyWeights = this.initializeStrategyWeights();
    this.threatMap = new Map();
    this.lastActionTime = Date.now();
  }

  /**
   * Initialize AI strategy weights
   */
  private initializeStrategyWeights(): AIStrategyWeight {
    return {
      expansion: 0.2,
      defense: 0.3,
      offense: 0.2,
      economy: 0.2,
      technology: 0.1
    };
  }

  /**
   * Update AI state with new game state
   */
  public updateState(newState: GameState): void {
    this.gameState = newState;
    this.updateThreatMap();
    this.adjustStrategyWeights();
    this.emit('stateUpdated', this.getAIMetrics());
  }

  /**
   * Generate the next AI action based on current state
   */
  public generateNextAction(): QueuedAction | null {
    const now = Date.now();
    if (now - this.lastActionTime < this.calculateActionDelay()) {
      return null;
    }

    const strategy = this.determineStrategy();
    const action = this.generateActionForStrategy(strategy);
    
    if (action) {
      this.lastActionTime = now;
      this.emit('actionGenerated', action);
    }

    return action;
  }

  /**
   * Calculate delay between AI actions based on aggression level
   */
  private calculateActionDelay(): number {
    const baseDelay = 5000; // 5 seconds
    const aggressionMultiplier = 1 - this.calculateCurrentAggression();
    return baseDelay * aggressionMultiplier;
  }

  /**
   * Update threat map based on current game state
   */
  private updateThreatMap(): void {
    this.threatMap.clear();
    
    for (const [regionId, region] of this.gameState.regions) {
      const threatLevel = this.calculateRegionThreatLevel(region);
      this.threatMap.set(regionId, threatLevel);
    }
  }

  /**
   * Calculate threat level for a specific region
   */
  private calculateRegionThreatLevel(region: ServerRegion): RegionThreatLevel {
    const playerUnits = this.countPlayerUnitsInRegion(region);
    const resourceValue = this.calculateRegionResourceValue(region);
    const strategicValue = this.calculateStrategicValue(region);
    
    return {
      regionId: region.id,
      threatScore: (playerUnits * 0.4) + (strategicValue * 0.6),
      strategicValue,
      resourceValue
    };
  }

  /**
   * Count player military units in a region
   */
  private countPlayerUnitsInRegion(region: ServerRegion): number {
    let count = 0;
    region.units.forEach(unit => {
      if (unit.owner !== 'AI') {
        count++;
      }
    });
    return count;
  }

  /**
   * Calculate resource value of a region
   */
  private calculateRegionResourceValue(region: ServerRegion): number {
    const resources = region.resources.base;
    return Object.values(resources).reduce((sum, value) => sum + value, 0);
  }

  /**
   * Calculate strategic value of a region
   */
  private calculateStrategicValue(region: ServerRegion): number {
    let value = 0;
    
    // Base value from resource production
    value += this.calculateRegionResourceValue(region) * 0.5;
    
    // Value from defensive structures
    value += region.defensiveStructures.length * 10;
    
    // Value from population
    value += Math.log10(region.population) * 5;
    
    // Bonus for regions connected to our territory
    if (this.isConnectedToAITerritory(region)) {
      value *= 1.5;
    }
    
    return value;
  }

  /**
   * Check if region is connected to AI territory
   */
  private isConnectedToAITerritory(region: ServerRegion): boolean {
    // Implementation would check for adjacent regions controlled by AI
    return true; // Placeholder
  }

  /**
   * Adjust strategy weights based on game state
   */
  private adjustStrategyWeights(): void {
    const worldState = this.gameState.worldState;
    
    // Adjust based on global stability
    if (worldState.globalStability < 0.4) {
      this.strategyWeights.defense += this.learningRate;
      this.strategyWeights.offense -= this.learningRate;
    }
    
    // Adjust based on resource availability
    const avgResources = this.calculateAverageResources(worldState);
    if (avgResources < 0.3) {
      this.strategyWeights.economy += this.learningRate;
      this.strategyWeights.expansion -= this.learningRate;
    }
    
    // Normalize weights
    this.normalizeWeights();
  }

  /**
   * Calculate average resource availability
   */
  private calculateAverageResources(worldState: WorldState): number {
    const resources = worldState.resourceAvailability;
    return Object.values(resources).reduce((sum, value) => sum + value, 0) / 
      Object.keys(resources).length;
  }

  /**
   * Normalize strategy weights to sum to 1
   */
  private normalizeWeights(): void {
    const sum = Object.values(this.strategyWeights)
      .reduce((total, weight) => total + weight, 0);
    
    for (const key of Object.keys(this.strategyWeights) as Array<keyof AIStrategyWeight>) {
      this.strategyWeights[key] /= sum;
    }
  }

  /**
   * Determine the next strategy based on weights and state
   */
  private determineStrategy(): ActionType {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    // Map strategy weights to action types
    const strategyMap: Record<keyof AIStrategyWeight, ActionType> = {
      expansion: ActionType.MOVE,
      defense: ActionType.BUILD,
      offense: ActionType.ATTACK,
      economy: ActionType.ECONOMIC,
      technology: ActionType.RESEARCH
    };
    
    for (const [strategy, weight] of Object.entries(this.strategyWeights)) {
      cumulativeWeight += weight;
      if (random <= cumulativeWeight) {
        return strategyMap[strategy as keyof AIStrategyWeight];
      }
    }
    
    return ActionType.ECONOMIC;
  }

  /**
   * Generate specific action based on chosen strategy
   */
  private generateActionForStrategy(strategy: ActionType): QueuedAction | null {
    const aiId = 'AI' as PlayerId; // Assuming AI has a special PlayerId
    
    switch (strategy) {
      case ActionType.ATTACK:
        return this.generateAttackAction(aiId);
      case ActionType.MOVE:
        return this.generateMoveAction(aiId);
      case ActionType.BUILD:
        return this.generateBuildAction(aiId);
      case ActionType.ECONOMIC:
        return this.generateEconomicAction(aiId);
      case ActionType.RESEARCH:
        return this.generateResearchAction(aiId);
      default:
        return null;
    }
  }

  /**
   * Generate attack action
   */
  private generateAttackAction(aiId: PlayerId): QueuedAction {
    const targetRegion = this.selectAttackTarget();
    
    return {
      id: crypto.randomUUID(),
      playerId: aiId,
      type: ActionType.ATTACK,
      priority: 0.8,
      timestamp: new Date(),
      data: {
        sourceId: this.selectSourceRegion(targetRegion.regionId),
        targetId: targetRegion.regionId,
        units: this.selectUnitsForAttack(targetRegion.threatScore)
      },
      status: 'queued'
    };
  }

  /**
   * Select target region for attack
   */
  private selectAttackTarget(): RegionThreatLevel {
    const targets = Array.from(this.threatMap.values())
      .filter(region => !this.isConnectedToAITerritory(this.gameState.regions.get(region.regionId)!))
      .sort((a, b) => b.strategicValue - a.strategicValue);
    
    return targets[0];
  }

  /**
   * Select source region for action
   */
  private selectSourceRegion(targetId: RegionId): string {
    // Implementation would select best region to attack from
    return 'region-1'; // Placeholder
  }

  /**
   * Select units for attack based on threat level
   */
  private selectUnitsForAttack(threatScore: number): string[] {
    // Implementation would select appropriate units based on threat
    return ['unit-1', 'unit-2']; // Placeholder
  }

  /**
   * Generate move action
   */
  private generateMoveAction(aiId: PlayerId): QueuedAction {
    // Similar to attack action but for movement
    return {
      id: crypto.randomUUID(),
      playerId: aiId,
      type: ActionType.MOVE,
      priority: 0.6,
      timestamp: new Date(),
      data: {
        sourceId: 'region-1',
        targetId: 'region-2',
        units: ['unit-1']
      },
      status: 'queued'
    };
  }

  /**
   * Generate build action
   */
  private generateBuildAction(aiId: PlayerId): QueuedAction {
    return {
      id: crypto.randomUUID(),
      playerId: aiId,
      type: ActionType.BUILD,
      priority: 0.7,
      timestamp: new Date(),
      data: {
        sourceId: this.selectBuildRegion(),
        targetId: 'structure-1',
        resources: this.calculateBuildCost()
      },
      status: 'queued'
    };
  }

  /**
   * Select region for building
   */
  private selectBuildRegion(): string {
    // Implementation would select optimal region for building
    return 'region-1'; // Placeholder
  }

  /**
   * Calculate resource cost for building
   */
  private calculateBuildCost(): ResourceCost {
    return {
      energy: 100,
      materials: 100,
      technology: 50,
      intelligence: 25,
      morale: 10
    };
  }

  /**
   * Generate economic action
   */
  private generateEconomicAction(aiId: PlayerId): QueuedAction {
    return {
      id: crypto.randomUUID(),
      playerId: aiId,
      type: ActionType.ECONOMIC,
      priority: 0.5,
      timestamp: new Date(),
      data: {
        sourceId: 'region-1',
        targetId: 'market',
        resources: this.calculateTradeResources()
      },
      status: 'queued'
    };
  }

  /**
   * Calculate resources for trade
   */
  private calculateTradeResources(): ResourceCost {
    // Implementation would calculate optimal trade amounts
    return {
      energy: 50,
      materials: -50,
      technology: 0,
      intelligence: 0,
      morale: 0
    };
  }

  /**
   * Generate research action
   */
  private generateResearchAction(aiId: PlayerId): QueuedAction {
    return {
      id: crypto.randomUUID(),
      playerId: aiId,
      type: ActionType.RESEARCH,
      priority: 0.4,
      timestamp: new Date(),
      data: {
        sourceId: 'research-lab',
        targetId: this.selectResearchProject(),
        resources: this.calculateResearchCost()
      },
      status: 'queued'
    };
  }

  /**
   * Select research project
   */
  private selectResearchProject(): string {
    // Implementation would select optimal research project
    return 'research-1'; // Placeholder
  }

  /**
   * Calculate research cost
   */
  private calculateResearchCost(): ResourceCost {
    return {
      energy: 200,
      materials: 100,
      technology: 300,
      intelligence: 150,
      morale: 50
    };
  }

  /**
   * Calculate current AI aggression level
   */
  private calculateCurrentAggression(): number {
    const baseAggression = this.baseAggressionLevel;
    const cycleProgress = this.gameState.getCurrentCycle().cycleId / 8192;
    const stabilityFactor = 1 - this.gameState.worldState.globalStability;
    
    return Math.min(1, baseAggression + (cycleProgress * 0.3) + (stabilityFactor * 0.2));
  }

  /**
   * Get current AI metrics
   */
  public getAIMetrics(): AIActivityMetrics {
    return {
      aggressionLevel: this.calculateCurrentAggression(),
      expansionRate: this.strategyWeights.expansion,
      techProgress: this.calculateTechProgress(),
      targetedRegions: this.getTargetedRegions(),
      predictedNextActions: this.getPredictedActions()
    };
  }

  /**
   * Calculate technology progress
   */
  private calculateTechProgress(): number {
    // Implementation would calculate actual tech progress
    return 0.5; // Placeholder
  }

  /**
   * Get list of targeted regions
   */
  private getTargetedRegions(): RegionId[] {
    return Array.from(this.threatMap.entries())
      .filter(([_, threat]) => threat.threatScore > 0.7)
      .map(([regionId, _]) => regionId);
  }

  /**
   * Get predicted next actions
   */
  private getPredictedActions(): PredictedAction[] {
    const predictions: PredictedAction[] = [];
    
    for (const [strategy, weight] of Object.entries(this.strategyWeights)) {
      if (weight > 0.2) {
        predictions.push({
          type: ActionType[strategy.toUpperCase() as keyof typeof ActionType],
          probability: weight,
          targetRegion: this.predictTargetForStrategy(strategy as keyof AIStrategyWeight),
          estimatedTiming: this.calculateActionDelay(),
          potentialImpact: weight * 100
        });
      }
    }
    
    return predictions;
  }

  /**
   * Predict target region for a strategy
   */
  private predictTargetForStrategy(strategy: keyof AIStrategyWeight): RegionId {
    switch (strategy) {
      case 'expansion':
        return this.findBestExpansionTarget();
      case 'offense':
        return this.findBestAttackTarget();
      case 'defense':
        return this.findMostThreatenedRegion();
      case 'economy':
        return this.findBestEconomicTarget();
      case 'technology':
        return this.findBestResearchLocation();
      default:
        return Array.from(this.gameState.regions.keys())[0];
    }
  }

  /**
   * Find best region for expansion
   */
  private findBestExpansionTarget(): RegionId {
    const neutralRegions = Array.from(this.gameState.regions.entries())
      .filter(([_, region]) => !region.controller)
      .map(([id, region]) => ({
        id,
        value: this.calculateExpansionValue(region)
      }))
      .sort((a, b) => b.value - a.value);

    return neutralRegions[0]?.id || Array.from(this.gameState.regions.keys())[0];
  }

  /**
   * Calculate expansion value for a region
   */
  private calculateExpansionValue(region: ServerRegion): number {
    let value = this.calculateRegionResourceValue(region);
    
    // Bonus for strategic position
    value *= this.isConnectedToAITerritory(region) ? 1.5 : 1;
    
    // Penalty for distance from existing territory
    const distancePenalty = this.calculateDistancePenalty(region);
    value *= (1 - distancePenalty);
    
    // Bonus for defensibility
    value *= (1 + (region.defensiveStructures.length * 0.1));
    
    return value;
  }

  /**
   * Calculate distance penalty for a region
   */
  private calculateDistancePenalty(region: ServerRegion): number {
    // Implementation would calculate actual distance from AI territory
    return 0.2; // Placeholder
  }

  /**
   * Find best target for attack
   */
  private findBestAttackTarget(): RegionId {
    const targetRegions = Array.from(this.gameState.regions.entries())
      .filter(([_, region]) => region.controller && region.controller !== 'AI')
      .map(([id, region]) => ({
        id,
        value: this.calculateAttackValue(region)
      }))
      .sort((a, b) => b.value - a.value);

    return targetRegions[0]?.id || Array.from(this.gameState.regions.keys())[0];
  }

  /**
   * Calculate attack value for a region
   */
  private calculateAttackValue(region: ServerRegion): number {
    let value = this.calculateStrategicValue(region);
    
    // Adjust based on defender strength
    const defenderStrength = this.calculateDefenderStrength(region);
    value *= (1 - (defenderStrength * 0.5));
    
    // Bonus for weakened regions
    if (region.population < 1000 || defenderStrength < 0.3) {
      value *= 1.5;
    }
    
    return value;
  }

  /**
   * Calculate defender strength in a region
   */
  private calculateDefenderStrength(region: ServerRegion): number {
    let strength = 0;
    
    // Sum up military units
    region.units.forEach(unit => {
      if (unit.owner !== 'AI') {
        strength += unit.health * this.getUnitTypeMultiplier(unit.type);
      }
    });
    
    // Add defensive structures
    strength += region.defensiveStructures.length * 100;
    
    return Math.min(1, strength / 1000); // Normalize to 0-1
  }

  /**
   * Get multiplier for different unit types
   */
  private getUnitTypeMultiplier(type: UnitType): number {
    switch (type) {
      case UnitType.INFANTRY:
        return 1;
      case UnitType.MECHANIZED:
        return 2;
      case UnitType.AERIAL:
        return 1.5;
      case UnitType.NAVAL:
        return 2;
      case UnitType.SPECIAL:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Find most threatened region
   */
  private findMostThreatenedRegion(): RegionId {
    const aiRegions = Array.from(this.gameState.regions.entries())
      .filter(([_, region]) => region.controller === 'AI')
      .map(([id, region]) => ({
        id,
        threat: this.calculateThreatLevel(region)
      }))
      .sort((a, b) => b.threat - a.threat);

    return aiRegions[0]?.id || Array.from(this.gameState.regions.keys())[0];
  }

  /**
   * Calculate threat level for a region
   */
  private calculateThreatLevel(region: ServerRegion): number {
    let threat = 0;
    
    // Threat from nearby enemy units
    threat += this.calculateNearbyEnemyThreat(region);
    
    // Threat from region status
    if (region.contestedBy.length > 0) {
      threat += 0.5;
    }
    
    // Strategic value adds to threat level
    threat += this.calculateStrategicValue(region) * 0.3;
    
    return threat;
  }

  /**
   * Calculate threat from nearby enemy units
   */
  private calculateNearbyEnemyThreat(region: ServerRegion): number {
    // Implementation would calculate actual threat from nearby enemies
    return 0.5; // Placeholder
  }

  /**
   * Find best economic target
   */
  private findBestEconomicTarget(): RegionId {
    const potentialTargets = Array.from(this.gameState.regions.entries())
      .filter(([_, region]) => region.controller === 'AI')
      .map(([id, region]) => ({
        id,
        value: this.calculateEconomicValue(region)
      }))
      .sort((a, b) => b.value - a.value);

    return potentialTargets[0]?.id || Array.from(this.gameState.regions.keys())[0];
  }

  /**
   * Calculate economic value for a region
   */
  private calculateEconomicValue(region: ServerRegion): number {
    let value = 0;
    
    // Base resource production value
    value += this.calculateRegionResourceValue(region);
    
    // Population contribution
    value += Math.log10(region.population) * 100;
    
    // Economic structure bonus
    value += region.economicStructures.length * 200;
    
    // Efficiency bonus
    value *= region.resources.efficiency;
    
    return value;
  }

  /**
   * Find best location for research
   */
  private findBestResearchLocation(): RegionId {
    const researchLocations = Array.from(this.gameState.regions.entries())
      .filter(([_, region]) => region.controller === 'AI')
      .map(([id, region]) => ({
        id,
        value: this.calculateResearchValue(region)
      }))
      .sort((a, b) => b.value - a.value);

    return researchLocations[0]?.id || Array.from(this.gameState.regions.keys())[0];
  }

  /**
   * Calculate research value for a region
   */
  private calculateResearchValue(region: ServerRegion): number {
    let value = 0;
    
    // Technology resource availability
    value += region.resources.base.technology * 2;
    
    // Intelligence resource bonus
    value += region.resources.base.intelligence;
    
    // Research structure bonus
    const researchStructures = region.economicStructures.filter(s => 
      s.type === 'laboratory' || s.type === 'observatory'
    );
    value += researchStructures.length * 300;
    
    // Population education bonus (could be expanded)
    value += Math.log10(region.population) * 50;
    
    return value;
  }

  /**
   * Handle world events that affect AI behavior
   */
  public handleWorldEvent(eventType: WorldEventType): void {
    switch (eventType) {
      case WorldEventType.NATURAL_DISASTER:
        this.strategyWeights.defense += this.learningRate * 2;
        this.strategyWeights.economy += this.learningRate;
        break;
      case WorldEventType.ECONOMIC_CRISIS:
        this.strategyWeights.economy += this.learningRate * 3;
        this.strategyWeights.expansion -= this.learningRate;
        break;
      case WorldEventType.TECHNOLOGICAL_BREAKTHROUGH:
        this.strategyWeights.technology += this.learningRate * 2;
        break;
      case WorldEventType.SOCIAL_UNREST:
        this.strategyWeights.defense += this.learningRate;
        this.strategyWeights.offense -= this.learningRate;
        break;
    }
    
    this.normalizeWeights();
    this.emit('strategyUpdated', this.strategyWeights);
  }
}