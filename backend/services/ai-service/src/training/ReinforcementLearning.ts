import { EventEmitter } from 'events';
import {
  GameState,
  ActionType,
  PlayerId,
  RegionId,
  ResourceCost,
  CombatResult,
  WorldEventType,
  GameEvent,
  AIActivityMetrics
} from '../../../game-logic-service/types';

interface State {
  resources: ResourceCost;
  controlledRegions: RegionId[];
  threatLevel: number;
  stability: number;
  phase: string;
  cycleProgress: number;
}

interface Action {
  type: ActionType;
  targetRegion?: RegionId;
  resources?: Partial<ResourceCost>;
  priority: number;
}

interface Experience {
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
}

export class ReinforcementLearning extends EventEmitter {
  private readonly learningRate: number = 0.1;
  private readonly discountFactor: number = 0.95;
  private readonly explorationRate: number = 0.2;
  private readonly minExplorationRate: number = 0.01;
  private readonly explorationDecay: number = 0.995;
  private readonly batchSize: number = 32;
  private readonly maxMemorySize: number = 10000;

  private qTable: Map<string, Map<string, number>>;
  private experienceMemory: Experience[];
  private currentExplorationRate: number;
  private episodeCount: number;
  private episodeRewards: number[];

  constructor() {
    super();
    this.qTable = new Map();
    this.experienceMemory = [];
    this.currentExplorationRate = this.explorationRate;
    this.episodeCount = 0;
    this.episodeRewards = [];
  }

  /**
   * Convert game state to reinforcement learning state
   */
  private gameStateToState(gameState: GameState, playerId: PlayerId): State {
    const player = gameState.players.get(playerId);
    if (!player) {
      throw new Error('Player not found in game state');
    }

    return {
      resources: player.gameState.resources,
      controlledRegions: Array.from(gameState.regions.entries())
        .filter(([_, region]) => region.controller === playerId)
        .map(([id, _]) => id),
      threatLevel: gameState.worldState.aiActivity.aggressionLevel,
      stability: gameState.worldState.globalStability,
      phase: gameState.getCurrentCycle().currentPhase,
      cycleProgress: gameState.getCurrentCycle().cycleId / 8192
    };
  }

  /**
   * Convert state to string key for Q-table
   */
  private getStateKey(state: State): string {
    return JSON.stringify({
      resourceLevels: Object.entries(state.resources)
        .map(([key, value]) => `${key}:${Math.floor(value / 100)}`)
        .join(','),
      regionCount: state.controlledRegions.length,
      threatLevel: Math.floor(state.threatLevel * 10),
      stability: Math.floor(state.stability * 10),
      phase: state.phase,
      cycleProgress: Math.floor(state.cycleProgress * 10)
    });
  }

  /**
   * Convert action to string key for Q-table
   */
  private getActionKey(action: Action): string {
    return JSON.stringify({
      type: action.type,
      targetRegion: action.targetRegion || 'none',
      resourceUse: action.resources ? 
        Object.entries(action.resources)
          .map(([key, value]) => `${key}:${Math.floor(value / 100)}`)
          .join(',') : 'none',
      priority: Math.floor(action.priority * 10)
    });
  }

  /**
   * Calculate reward based on action result and state transition
   */
  private calculateReward(
    action: Action,
    oldState: State,
    newState: State,
    result: CombatResult | null
  ): number {
    let reward = 0;

    // Resource management
    const resourceDelta = Object.entries(newState.resources).reduce(
      (sum, [key, value]) => sum + (value - oldState.resources[key]),
      0
    );
    reward += resourceDelta * 0.01;

    // Territory control
    const territoryDelta = newState.controlledRegions.length - oldState.controlledRegions.length;
    reward += territoryDelta * 100;

    // Combat outcomes
    if (result) {
      reward += result.territoryChanged ? 200 : -50;
      const unitLossRatio = result.units.filter(u => u.destroyed).length / result.units.length;
      reward -= unitLossRatio * 100;
    }

    // Strategic positioning
    reward += (newState.stability - oldState.stability) * 50;

    // Threat management
    reward -= (newState.threatLevel - oldState.threatLevel) * 75;

    // Phase-specific rewards
    switch (action.type) {
      case ActionType.BUILD:
        reward += 25; // Encourage infrastructure development
        break;
      case ActionType.RESEARCH:
        reward += 30; // Encourage technology advancement
        break;
      case ActionType.DIPLOMATIC:
        reward += newState.stability > oldState.stability ? 40 : -20;
        break;
    }

    return reward;
  }

  /**
   * Add experience to memory
   */
  private addExperience(experience: Experience): void {
    this.experienceMemory.push(experience);
    if (this.experienceMemory.length > this.maxMemorySize) {
      this.experienceMemory.shift();
    }
  }

  /**
   * Sample batch of experiences for training
   */
  private sampleExperiences(): Experience[] {
    const batchSize = Math.min(this.batchSize, this.experienceMemory.length);
    const experiences: Experience[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const index = Math.floor(Math.random() * this.experienceMemory.length);
      experiences.push(this.experienceMemory[index]);
    }
    
    return experiences;
  }

  /**
   * Update Q-values based on experience
   */
  private updateQValues(experience: Experience): void {
    const { state, action, reward, nextState, done } = experience;
    const stateKey = this.getStateKey(state);
    const actionKey = this.getActionKey(action);

    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }

    const qValues = this.qTable.get(stateKey)!;
    const currentQ = qValues.get(actionKey) || 0;

    let nextMaxQ = 0;
    if (!done) {
      const nextStateKey = this.getStateKey(nextState);
      const nextQValues = this.qTable.get(nextStateKey);
      if (nextQValues && nextQValues.size > 0) {
        nextMaxQ = Math.max(...Array.from(nextQValues.values()));
      }
    }

    const newQ = currentQ + this.learningRate * (
      reward + this.discountFactor * nextMaxQ - currentQ
    );

    qValues.set(actionKey, newQ);
  }

  /**
   * Select action based on current state using epsilon-greedy policy
   */
  public selectAction(
    state: State,
    availableActions: Action[]
  ): Action {
    if (Math.random() < this.currentExplorationRate) {
      // Exploration: choose random action
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    // Exploitation: choose best action based on Q-values
    const stateKey = this.getStateKey(state);
    const qValues = this.qTable.get(stateKey) || new Map();

    let bestAction = availableActions[0];
    let bestValue = Number.NEGATIVE_INFINITY;

    for (const action of availableActions) {
      const actionKey = this.getActionKey(action);
      const value = qValues.get(actionKey) || 0;
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Train on game experience
   */
  public train(gameState: GameState, playerId: PlayerId, result: CombatResult | null): void {
    const currentState = this.gameStateToState(gameState, playerId);
    
    // Update exploration rate
    this.currentExplorationRate = Math.max(
      this.minExplorationRate,
      this.currentExplorationRate * this.explorationDecay
    );

    // Sample and learn from experiences
    const experiences = this.sampleExperiences();
    for (const experience of experiences) {
      this.updateQValues(experience);
    }

    this.episodeCount++;
    this.emit('trainingProgress', {
      episodeCount: this.episodeCount,
      explorationRate: this.currentExplorationRate,
      averageReward: this.getAverageReward()
    });
  }

  /**
   * Handle game events that affect learning
   */
  public handleGameEvent(event: GameEvent): void {
    switch (event.type) {
      case 'COMBAT_RESULT':
        // Update Q-values based on combat outcome
        const combatResult = event.data as CombatResult;
        const reward = combatResult.territoryChanged ? 200 : -50;
        this.episodeRewards.push(reward);
        break;

      case 'WORLD_EVENT':
        // Adjust exploration rate based on significant world events
        if (event.data.type === WorldEventType.AI_UPRISING) {
          this.currentExplorationRate = Math.min(
            this.explorationRate,
            this.currentExplorationRate * 1.5
          );
        }
        break;
    }
  }

  /**
   * Get average reward over recent episodes
   */
  private getAverageReward(): number {
    const recentRewards = this.episodeRewards.slice(-100);
    return recentRewards.reduce((sum, reward) => sum + reward, 0) / recentRewards.length;
  }

  /**
   * Save learning progress
   */
  public saveProgress(): string {
    return JSON.stringify({
      qTable: Array.from(this.qTable.entries()).map(([state, actions]) => [
        state,
        Array.from(actions.entries())
      ]),
      explorationRate: this.currentExplorationRate,
      episodeCount: this.episodeCount,
      episodeRewards: this.episodeRewards
    });
  }

  /**
   * Load saved learning progress
   */
  public loadProgress(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState);
      this.qTable = new Map(
        state.qTable.map(([stateKey, actions]) => [
          stateKey,
          new Map(actions)
        ])
      );
      this.currentExplorationRate = state.explorationRate;
      this.episodeCount = state.episodeCount;
      this.episodeRewards = state.episodeRewards;

      this.emit('progressLoaded', {
        episodeCount: this.episodeCount,
        explorationRate: this.currentExplorationRate,
        averageReward: this.getAverageReward()
      });
    } catch (error) {
      throw new Error('Failed to load reinforcement learning progress');
    }
  }

  /**
   * Get current learning metrics
   */
  public getMetrics(): AIActivityMetrics {
    return {
      aggressionLevel: this.currentExplorationRate,
      expansionRate: this.getAverageReward() / 1000,
      techProgress: this.episodeCount / 1000,
      targetedRegions: [],
      predictedNextActions: []
    };
  }

  /**
   * Reset learning progress
   */
  public reset(): void {
    this.qTable.clear();
    this.experienceMemory = [];
    this.currentExplorationRate = this.explorationRate;
    this.episodeCount = 0;
    this.episodeRewards = [];
    this.emit('learningReset');
  }
}