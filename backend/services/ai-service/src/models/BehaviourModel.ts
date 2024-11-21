import { EventEmitter } from 'events';
import {
  PlayerId,
  GameState,
  ActionType,
  RegionId,
  ResourceCost,
  AIActivityMetrics,
  WorldEventType,
  ServerRegion,
  UnitType
} from '../../../game-logic-service/types';

/**
 * Defines the personality traits of an AI opponent
 */
export interface AIPersonality {
  aggression: number;       // 0-1: tendency to attack
  expansion: number;        // 0-1: tendency to capture new regions
  technology: number;       // 0-1: focus on research and development
  diplomacy: number;        // 0-1: likelihood to form alliances
  economics: number;        // 0-1: focus on resource management
  adaptation: number;       // 0-1: ability to change strategy
}

/**
 * Historical action record for learning
 */
export interface ActionHistory {
  actionType: ActionType;
  success: boolean;
  resourceCost: ResourceCost;
  regionId: RegionId;
  timestamp: Date;
  worldState: {
    stability: number;
    threatLevel: number;
    resourceAvailability: Record<string, number>;
  };
}

/**
 * Strategy weights for different game phases
 */
export interface PhaseStrategy {
  preparation: Record<ActionType, number>;
  action: Record<ActionType, number>;
  resolution: Record<ActionType, number>;
}

/**
 * Behavioral pattern predictions
 */
export interface BehaviorPrediction {
  nextLikelyAction: ActionType;
  targetRegion?: RegionId;
  estimatedResourceUse: Partial<ResourceCost>;
  confidence: number;
  alternativeActions: Array<{
    action: ActionType;
    probability: number;
  }>;
}

export class BehaviorModel extends EventEmitter {
  private personality: AIPersonality;
  private actionHistory: ActionHistory[];
  private phaseStrategies: PhaseStrategy;
  private readonly learningRate: number = 0.1;
  private readonly maxHistorySize: number = 1000;

  constructor(initialPersonality?: Partial<AIPersonality>) {
    super();
    this.personality = this.initializePersonality(initialPersonality);
    this.actionHistory = [];
    this.phaseStrategies = this.initializePhaseStrategies();
  }

  /**
   * Initialize AI personality with defaults or provided values
   */
  private initializePersonality(partial?: Partial<AIPersonality>): AIPersonality {
    const basePersonality: AIPersonality = {
      aggression: 0.5,
      expansion: 0.5,
      technology: 0.5,
      diplomacy: 0.5,
      economics: 0.5,
      adaptation: 0.5
    };

    return {
      ...basePersonality,
      ...partial
    };
  }

  /**
   * Initialize strategy weights for different game phases
   */
  private initializePhaseStrategies(): PhaseStrategy {
    const defaultWeights = {
      [ActionType.MOVE]: 0.2,
      [ActionType.ATTACK]: 0.2,
      [ActionType.BUILD]: 0.2,
      [ActionType.RESEARCH]: 0.1,
      [ActionType.DIPLOMATIC]: 0.1,
      [ActionType.ECONOMIC]: 0.2
    };

    return {
      preparation: { ...defaultWeights },
      action: { ...defaultWeights },
      resolution: { ...defaultWeights }
    };
  }

  /**
   * Update behavior model based on action results
   */
  public updateFromAction(
    action: ActionHistory,
    gameState: GameState
  ): void {
    this.addToHistory(action);
    this.adjustPersonality(action, gameState);
    this.updatePhaseStrategies(action);
    this.emit('behaviorUpdated', this.getMetrics());
  }

  /**
   * Add action to history and maintain size limit
   */
  private addToHistory(action: ActionHistory): void {
    this.actionHistory.push(action);
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }

  /**
   * Adjust personality traits based on action outcomes
   */
  private adjustPersonality(
    action: ActionHistory,
    gameState: GameState
  ): void {
    const adjustment = action.success ? this.learningRate : -this.learningRate;

    switch (action.actionType) {
      case ActionType.ATTACK:
        this.personality.aggression += adjustment;
        break;
      case ActionType.MOVE:
        this.personality.expansion += adjustment;
        break;
      case ActionType.RESEARCH:
        this.personality.technology += adjustment;
        break;
      case ActionType.DIPLOMATIC:
        this.personality.diplomacy += adjustment;
        break;
      case ActionType.ECONOMIC:
        this.personality.economics += adjustment;
        break;
    }

    // Normalize personality traits to 0-1 range
    Object.keys(this.personality).forEach(trait => {
      this.personality[trait] = Math.max(0, Math.min(1, this.personality[trait]));
    });

    // Adjust adaptation based on global state
    this.personality.adaptation = Math.min(
      1,
      this.personality.adaptation +
        (gameState.worldState.globalStability < 0.5 ? adjustment : 0)
    );
  }

  /**
   * Update phase strategies based on action success
   */
  private updatePhaseStrategies(action: ActionHistory): void {
    const phases = ['preparation', 'action', 'resolution'] as const;
    const adjustment = action.success ? this.learningRate : -this.learningRate;

    phases.forEach(phase => {
      const currentWeight = this.phaseStrategies[phase][action.actionType];
      const newWeight = currentWeight + adjustment;
      
      // Update weight for the action type
      this.phaseStrategies[phase][action.actionType] = newWeight;

      // Normalize weights for the phase
      const total = Object.values(this.phaseStrategies[phase])
        .reduce((sum, weight) => sum + weight, 0);
      
      Object.keys(this.phaseStrategies[phase]).forEach(actionType => {
        this.phaseStrategies[phase][actionType] /= total;
      });
    });
  }

  /**
   * Generate behavior prediction based on current state
   */
  public predictBehavior(
    gameState: GameState,
    currentPhase: string
  ): BehaviorPrediction {
    const phaseWeights = this.phaseStrategies[currentPhase];
    const predictions = Object.entries(phaseWeights)
      .map(([action, weight]) => ({
        action: action as ActionType,
        probability: this.calculateActionProbability(
          action as ActionType,
          weight,
          gameState
        )
      }))
      .sort((a, b) => b.probability - a.probability);

    const bestAction = predictions[0];
    const targetRegion = this.predictTargetRegion(
      bestAction.action,
      gameState
    );

    return {
      nextLikelyAction: bestAction.action,
      targetRegion,
      estimatedResourceUse: this.estimateResourceUse(bestAction.action),
      confidence: bestAction.probability,
      alternativeActions: predictions.slice(1)
    };
  }

  /**
   * Calculate probability of taking an action
   */
  private calculateActionProbability(
    action: ActionType,
    baseWeight: number,
    gameState: GameState
  ): number {
    let probability = baseWeight;

    // Adjust based on personality
    switch (action) {
      case ActionType.ATTACK:
        probability *= this.personality.aggression;
        break;
      case ActionType.MOVE:
        probability *= this.personality.expansion;
        break;
      case ActionType.RESEARCH:
        probability *= this.personality.technology;
        break;
      case ActionType.DIPLOMATIC:
        probability *= this.personality.diplomacy;
        break;
      case ActionType.ECONOMIC:
        probability *= this.personality.economics;
        break;
    }

    // Adjust based on world state
    probability *= this.calculateWorldStateMultiplier(action, gameState);

    // Adjust based on recent history
    probability *= this.calculateHistoryMultiplier(action);

    return Math.min(1, Math.max(0, probability));
  }

  /**
   * Calculate world state influence on action probability
   */
  private calculateWorldStateMultiplier(
    action: ActionType,
    gameState: GameState
  ): number {
    const { globalStability, resourceAvailability } = gameState.worldState;
    let multiplier = 1;

    switch (action) {
      case ActionType.ATTACK:
        multiplier *= (1 - globalStability) * 1.5;
        break;
      case ActionType.ECONOMIC:
        multiplier *= Object.values(resourceAvailability)
          .reduce((avg, val) => avg + val, 0) / Object.keys(resourceAvailability).length;
        break;
      case ActionType.RESEARCH:
        multiplier *= resourceAvailability.technology || 1;
        break;
      case ActionType.DIPLOMATIC:
        multiplier *= globalStability;
        break;
    }

    return multiplier;
  }

  /**
   * Calculate history influence on action probability
   */
  private calculateHistoryMultiplier(action: ActionType): number {
    const recentActions = this.actionHistory.slice(-10);
    const successRate = recentActions
      .filter(a => a.actionType === action)
      .reduce((sum, a) => sum + (a.success ? 1 : 0), 0) / 
      Math.max(1, recentActions.filter(a => a.actionType === action).length);

    return 0.5 + (successRate * 0.5);
  }

  /**
   * Predict target region for an action
   */
  private predictTargetRegion(
    action: ActionType,
    gameState: GameState
  ): RegionId | undefined {
    // Implementation would analyze regions based on action type
    // This is a placeholder that would be implemented based on game rules
    return Object.keys(gameState.regions)[0] as RegionId;
  }

  /**
   * Estimate resource use for an action
   */
  private estimateResourceUse(action: ActionType): Partial<ResourceCost> {
    const recentSimilarActions = this.actionHistory
      .filter(a => a.actionType === action)
      .slice(-5);

    if (recentSimilarActions.length === 0) {
      return {
        energy: 100,
        materials: 100,
        technology: 50,
        intelligence: 25,
        morale: 10
      };
    }

    // Calculate average resource cost from recent similar actions
    return Object.keys(recentSimilarActions[0].resourceCost)
      .reduce((avg, resource) => {
        avg[resource] = Math.floor(
          recentSimilarActions.reduce((sum, action) => 
            sum + action.resourceCost[resource], 0) / recentSimilarActions.length
        );
        return avg;
      }, {} as Partial<ResourceCost>);
  }

  /**
   * Get current behavior metrics
   */
  public getMetrics(): AIActivityMetrics {
    return {
      aggressionLevel: this.personality.aggression,
      expansionRate: this.personality.expansion,
      techProgress: this.personality.technology,
      targetedRegions: this.getPrioritizedRegions(),
      predictedNextActions: this.getActionPredictions()
    };
  }

  /**
   * Get prioritized list of targeted regions
   */
  private getPrioritizedRegions(): RegionId[] {
    const recentActions = this.actionHistory.slice(-20);
    const regionFrequency = new Map<RegionId, number>();

    recentActions.forEach(action => {
      const count = regionFrequency.get(action.regionId) || 0;
      regionFrequency.set(action.regionId, count + 1);
    });

    return Array.from(regionFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([regionId]) => regionId);
  }

  /**
   * Get predicted next actions
   */
  private getActionPredictions(): Array<{
    type: ActionType;
    probability: number;
    targetRegion: RegionId;
    estimatedTiming: number;
    potentialImpact: number;
  }> {
    const predictions = Object.entries(this.phaseStrategies.action)
      .map(([action, weight]) => ({
        type: action as ActionType,
        probability: weight * this.personality.adaptation,
        targetRegion: this.getPrioritizedRegions()[0],
        estimatedTiming: this.estimateActionTiming(action as ActionType),
        potentialImpact: this.estimateActionImpact(action as ActionType)
      }))
      .sort((a, b) => b.probability - a.probability);

    return predictions.slice(0, 3); // Return top 3 predictions
  }

  /**
   * Estimate timing for an action
   */
  private estimateActionTiming(action: ActionType): number {
    const recentActions = this.actionHistory
      .filter(a => a.actionType === action)
      .slice(-5);

    if (recentActions.length < 2) {
      return 300; // Default 5 minutes
    }

    // Calculate average time between actions
    const timings = recentActions
      .slice(1)
      .map((action, index) => 
        action.timestamp.getTime() - recentActions[index].timestamp.getTime()
      );

    return Math.floor(
      timings.reduce((sum, timing) => sum + timing, 0) / timings.length
    );
  }

  /**
   * Estimate potential impact of an action
   */
  private estimateActionImpact(action: ActionType): number {
    const recentActions = this.actionHistory
      .filter(a => a.actionType === action && a.success)
      .slice(-5);

    if (recentActions.length === 0) {
      return 50; // Default medium impact
    }

    // Calculate impact based on resource costs
    return Math.floor(recentActions.reduce((sum, action) => 
      sum + Object.values(action.resourceCost)
        .reduce((total, cost) => total + cost, 0), 0
    ) / recentActions.length);
  }

  /**
   * Handle world events that affect behavior
   */
  public handleWorldEvent(eventType: WorldEventType): void {
    switch (eventType) {
      case WorldEventType.NATURAL_DISASTER:
        this.personality.economics += this.learningRate;
        this.personality.expansion -= this.learningRate;
        break;
      case WorldEventType.ECONOMIC_CRISIS:
        this.personality.economics += this.learningRate * 2;
        this.personality.aggression -= this.learningRate;
        break;
      case WorldEventType.TECHNOLOGICAL_BREAKTHROUGH:
        this.personality.technology += this.learningRate * 2;
        break;
      case WorldEventType.SOCIAL_UNREST:
        this.personality.diplomacy += this.learningRate;
        this.personality.aggression -= this.learningRate;
        break;
      case WorldEventType.AI_UPRISING:
        this.personality.aggression += this.learningRate * 3;
        this.personality.diplomacy -= this.learningRate * 2;
        break;
    }

    // Normalize personality traits after adjustments
    Object.keys(this.personality).forEach(trait => {
      this.personality[trait] = Math.max(0, Math.min(1, this.personality[trait]));
    });

    this.emit('personalityUpdated', this.personality);
  }

  /**
   * Save behavior model state
   */
  public serializeState(): string {
    return JSON.stringify({
      personality: this.personality,
      actionHistory: this.actionHistory,
      phaseStrategies: this.phaseStrategies
    });
  }

  /**
   * Load behavior model state
   */
  public loadState(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState);
      this.personality = state.personality;
      this.actionHistory = state.actionHistory;
      this.phaseStrategies = state.phaseStrategies;
      this.emit('stateLoaded', this.getMetrics());
    } catch (error) {
      throw new Error('Failed to load behavior model state');
    }
  }

  /**
   * Get current personality profile
   */
  public getPersonality(): AIPersonality {
    return { ...this.personality };
  }

  /**
   * Reset behavior model to initial state
   */
  public reset(initialPersonality?: Partial<AIPersonality>): void {
    this.personality = this.initializePersonality(initialPersonality);
    this.actionHistory = [];
    this.phaseStrategies = this.initializePhaseStrategies();
    this.emit('modelReset', this.getMetrics());
  }

  /**
   * Analyze action patterns for a specific time period
   */
  public analyzePatterns(timeWindow: number): {
    dominantStrategy: ActionType;
    successRate: number;
    resourceEfficiency: number;
    adaptabilityScore: number;
  } {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const relevantActions = this.actionHistory.filter(
      action => action.timestamp >= cutoffTime
    );

    if (relevantActions.length === 0) {
      return {
        dominantStrategy: ActionType.ECONOMIC,
        successRate: 0,
        resourceEfficiency: 0,
        adaptabilityScore: this.personality.adaptation
      };
    }

    // Calculate action frequencies
    const actionCounts = new Map<ActionType, number>();
    relevantActions.forEach(action => {
      const count = actionCounts.get(action.actionType) || 0;
      actionCounts.set(action.actionType, count + 1);
    });

    // Find dominant strategy
    const dominantStrategy = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];

    // Calculate success rate
    const successRate = relevantActions.filter(a => a.success).length / 
      relevantActions.length;

    // Calculate resource efficiency
    const resourceEfficiency = this.calculateResourceEfficiency(relevantActions);

    // Calculate adaptability score
    const adaptabilityScore = this.calculateAdaptabilityScore(relevantActions);

    return {
      dominantStrategy,
      successRate,
      resourceEfficiency,
      adaptabilityScore
    };
  }

  /**
   * Calculate resource efficiency from actions
   */
  private calculateResourceEfficiency(actions: ActionHistory[]): number {
    if (actions.length === 0) return 0;

    const resourceUsage = actions.reduce((total, action) => {
      Object.values(action.resourceCost).forEach(cost => {
        total += cost;
      });
      return total;
    }, 0);

    const successfulActions = actions.filter(a => a.success).length;
    return successfulActions / (resourceUsage || 1);
  }

  /**
   * Calculate adaptability score based on strategy changes
   */
  private calculateAdaptabilityScore(actions: ActionHistory[]): number {
    if (actions.length < 2) return this.personality.adaptation;

    let strategyChanges = 0;
    for (let i = 1; i < actions.length; i++) {
      if (actions[i].actionType !== actions[i - 1].actionType) {
        strategyChanges++;
      }
    }

    const baseScore = strategyChanges / (actions.length - 1);
    return (baseScore + this.personality.adaptation) / 2;
  }

  /**
   * Generate a behavior report for analysis
   */
  public generateBehaviorReport(): {
    shortTerm: ReturnType<typeof this.analyzePatterns>;
    longTerm: ReturnType<typeof this.analyzePatterns>;
    personality: AIPersonality;
    predictions: BehaviorPrediction[];
  } {
    return {
      shortTerm: this.analyzePatterns(1800000), // 30 minutes
      longTerm: this.analyzePatterns(86400000), // 24 hours
      personality: this.getPersonality(),
      predictions: this.getActionPredictions()
    };
  }
}