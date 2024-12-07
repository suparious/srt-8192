import { EventEmitter } from 'events';
import { GameState } from '../GameState';
import { CYCLE_DURATION_MS, TOTAL_CYCLES } from './GameLoop';
import {
  GamePhase,
  GameSession,
  PlayerId,
  ActionType,
  QueuedAction,
  ActionStatus,
  WorldEventType,
  GameEventType,
  EventVisibility,
  ServerGameCycle,
  ActionId,
  PhaseConfig
} from '../types';

export class TurnManager extends EventEmitter {
  private gameState: GameState;
  private currentPhase: GamePhase;
  private phaseTimeout: NodeJS.Timeout | null = null;
  private actionProcessingInterval: NodeJS.Timeout | null = null;
  private cycleStartTime: Date;
  private currentCycleNumber: number;

  private readonly phaseConfigs: Record<GamePhase, PhaseConfig> = {
    [GamePhase.PREPARATION]: {
      duration: 29.531, // 40% of 73.828s
      maxActionsPerPlayer: 5,
      resourceMultiplier: 1.5,
      aiAggressionMultiplier: 0.5
    },
    [GamePhase.ACTION]: {
      duration: 29.531, // 40% of 73.828s
      maxActionsPerPlayer: 10,
      resourceMultiplier: 1.0,
      aiAggressionMultiplier: 1.0
    },
    [GamePhase.RESOLUTION]: {
      duration: 11.074, // 15% of 73.828s
      maxActionsPerPlayer: 3,
      resourceMultiplier: 0.5,
      aiAggressionMultiplier: 1.5
    },
    [GamePhase.INTERMISSION]: {
      duration: 3.692, // 5% of 73.828s
      maxActionsPerPlayer: 0,
      resourceMultiplier: 0.0,
      aiAggressionMultiplier: 0.0
    }
  };

  constructor(gameState: GameState) {
    super();
    this.gameState = gameState;
    this.currentPhase = GamePhase.INTERMISSION;
    this.cycleStartTime = new Date();
    this.currentCycleNumber = 0;
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for game state changes
   */
  private initializeEventListeners(): void {
    this.gameState.on('actionQueued', this.handleActionQueued.bind(this));
    this.gameState.on('actionProcessed', this.handleActionProcessed.bind(this));
    this.gameState.on('worldEventTriggered', this.handleWorldEvent.bind(this));
  }

  /**
   * Start the game cycle
   */
  public startCycle(): void {
    this.cycleStartTime = new Date();
    this.currentPhase = GamePhase.PREPARATION;
    this.emit('cycleStarted', this.getCurrentCycleInfo());
    this.startPhase(this.currentPhase);
    this.startActionProcessing();
  }

  /**
   * Get current cycle information
   */
  private getCurrentCycleInfo(): ServerGameCycle {
    const now = new Date();
    const cycleElapsedTime = now.getTime() - this.cycleStartTime.getTime();
    const cycleProgress = cycleElapsedTime / CYCLE_DURATION_MS;
    
    return {
      cycleId: this.currentCycleNumber,
      startTime: this.cycleStartTime,
      endTime: new Date(this.cycleStartTime.getTime() + CYCLE_DURATION_MS),
      currentPhase: this.currentPhase,
      phaseEndTime: this.getPhaseEndTime(),
      totalPlayers: this.gameState.getSessionState().players.size,
      activePlayerCount: this.getActivePlayerCount(),
      progress: cycleProgress,
      remainingCycles: TOTAL_CYCLES - this.currentCycleNumber - 1
    };
  }

  /**
   * Get the end time for the current phase
   */
  private getPhaseEndTime(): Date {
    const config = this.phaseConfigs[this.currentPhase];
    return new Date(Date.now() + (config.duration * 1000));
  }

  /**
   * Get the count of active players
   */
  private getActivePlayerCount(): number {
    const session = this.gameState.getSessionState();
    return Array.from(session.players.values())
      .filter(player => player.gameState.isActive).length;
  }

  /**
   * Start a specific phase
   */
  private startPhase(phase: GamePhase): void {
    const config = this.phaseConfigs[phase];
    
    // Clear any existing phase timeout
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
    }

    // Perform phase initialization
    this.initializePhase(phase);

    // Schedule phase end
    this.phaseTimeout = setTimeout(() => {
      this.endPhase(phase);
    }, config.duration * 1000);

    // Emit phase start event
    this.emit('phaseStarted', {
      phase,
      config,
      timestamp: new Date(),
      cycleNumber: this.currentCycleNumber,
      expectedEndTime: this.getPhaseEndTime()
    });
  }

  /**
   * Initialize a new phase
   */
  private initializePhase(phase: GamePhase): void {
    const session = this.gameState.getSessionState();
    const config = this.phaseConfigs[phase];

    switch (phase) {
      case GamePhase.PREPARATION:
        // Reset action counts and distribute resources
        session.players.forEach(player => {
          player.gameState.actionsRemaining = config.maxActionsPerPlayer;
          this.distributePhaseResources(player.id, config.resourceMultiplier);
        });
        break;

      case GamePhase.ACTION:
        // Update AI behavior and prepare combat systems
        this.updateAIBehavior(config.aiAggressionMultiplier);
        this.prepareActionPhase();
        break;

      case GamePhase.RESOLUTION:
        // Process pending actions and calculate outcomes
        this.processResolutionPhase();
        break;

      case GamePhase.INTERMISSION:
        // Calculate rewards and prepare for next cycle
        this.handleIntermissionPhase();
        break;
    }
  }

  /**
   * Distribute resources for the current phase
   */
  private distributePhaseResources(playerId: PlayerId, multiplier: number): void {
    const baseResources = {
      energy: 100,
      materials: 100,
      technology: 50,
      intelligence: 25,
      morale: 10
    };

    const resources = Object.entries(baseResources).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: Math.floor(value * multiplier)
    }), {});

    this.gameState.addPlayerResources(playerId, resources);
  }

  /**
   * Update AI behavior for the current phase
   */
  private updateAIBehavior(aggressionMultiplier: number): void {
    const currentCycle = this.currentCycleNumber;
    const baseAggression = 0.5 + (currentCycle / TOTAL_CYCLES) * 0.5;
    
    this.gameState.updateAIActivity({
      aggressionLevel: baseAggression * aggressionMultiplier,
      expansionRate: 0.1 + (currentCycle / TOTAL_CYCLES) * 0.2,
      techProgress: currentCycle / TOTAL_CYCLES,
      cycleNumber: currentCycle,
      phaseType: this.currentPhase
    });
  }

  /**
   * Prepare systems for the action phase
   */
  private prepareActionPhase(): void {
    const session = this.gameState.getSessionState();
    
    // Clear old action queues
    session.actionQueue = session.actionQueue.filter(
      action => action.status === ActionStatus.QUEUED
    );

    // Update world state for the action phase
    this.gameState.updateWorldState({
      phase: this.currentPhase,
      cycle: this.currentCycleNumber,
      combatEnabled: true,
      resourceMultiplier: this.phaseConfigs[GamePhase.ACTION].resourceMultiplier
    });
  }

  /**
   * Process the resolution phase
   */
  private processResolutionPhase(): void {
    const session = this.gameState.getSessionState();
    
    // Sort pending actions by priority
    const pendingActions = session.actionQueue
      .filter(action => action.status === ActionStatus.QUEUED)
      .sort((a, b) => b.priority - a.priority);

    // Process high-priority actions immediately
    pendingActions
      .filter(action => action.priority > 0.8)
      .forEach(action => {
        this.gameState.processAction(action);
      });
  }

  /**
   * Handle the intermission phase
   */
  private handleIntermissionPhase(): void {
    // Calculate and distribute rewards
    this.calculateCycleRewards();

    // Clean up phase
    this.gameState.cleanup();

    // Prepare for next cycle
    if (this.currentCycleNumber < TOTAL_CYCLES - 1) {
      this.prepareNextCycle();
    } else {
      this.emit('gameCompleted', this.getCurrentCycleInfo());
    }
  }

  /**
   * Calculate and distribute cycle rewards
   */
  private calculateCycleRewards(): void {
    const session = this.gameState.getSessionState();
    const cycleInfo = this.getCurrentCycleInfo();

    session.players.forEach((player, playerId) => {
      const rewards = this.calculatePlayerRewards(player, cycleInfo);
      this.gameState.distributeRewards(playerId, rewards);
      
      this.emit('rewardsDistributed', {
        playerId,
        rewards,
        cycle: this.currentCycleNumber,
        timestamp: new Date()
      });
    });
  }

  /**
   * Calculate rewards for a specific player
   */
  private calculatePlayerRewards(player: any, cycleInfo: ServerGameCycle): any {
    const baseReward = {
      experience: 100,
      coins: 50,
      resources: {
        energy: 20,
        materials: 20,
        technology: 10,
        intelligence: 5,
        morale: 2
      }
    };

    // Apply cycle multiplier
    const cycleMultiplier = 1 + (this.currentCycleNumber / TOTAL_CYCLES);

    // Apply performance multiplier
    const performanceMultiplier = this.calculatePerformanceMultiplier(player.performanceMetrics);

    return {
      experience: Math.floor(baseReward.experience * cycleMultiplier * performanceMultiplier),
      coins: Math.floor(baseReward.coins * cycleMultiplier * performanceMultiplier),
      resources: Object.entries(baseReward.resources).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: Math.floor(value * cycleMultiplier * performanceMultiplier)
      }), {})
    };
  }

  /**
   * Calculate performance multiplier for rewards
   */
  private calculatePerformanceMultiplier(metrics: any): number {
    // Base multiplier starts at 1.0
    let multiplier = 1.0;

    // Adjust based on various performance metrics
    if (metrics.combatWinRate > 0.5) {
      multiplier += 0.2;
    }
    if (metrics.resourceEfficiency > 0.7) {
      multiplier += 0.2;
    }
    if (metrics.territoryControl > 0.3) {
      multiplier += 0.2;
    }
    if (metrics.diplomaticSuccess > 0.6) {
      multiplier += 0.2;
    }

    // Cap the multiplier at 2.0
    return Math.min(2.0, multiplier);
  }

  /**
   * Prepare for the next cycle
   */
  private prepareNextCycle(): void {
    this.currentCycleNumber++;
    this.cycleStartTime = new Date();
    
    // Reset phase-specific states
    const session = this.gameState.getSessionState();
    session.actionQueue = [];
    
    this.emit('cycleCompleted', {
      completedCycle: this.currentCycleNumber - 1,
      nextCycle: this.currentCycleNumber,
      timestamp: new Date()
    });
  }

  /**
   * End the current phase
   */
  private endPhase(phase: GamePhase): void {
    // Emit phase ended event
    this.emit('phaseEnded', {
      phase,
      timestamp: new Date(),
      cycleNumber: this.currentCycleNumber
    });

    // Determine and start next phase
    let nextPhase: GamePhase;
    switch (phase) {
      case GamePhase.PREPARATION:
        nextPhase = GamePhase.ACTION;
        break;
      case GamePhase.ACTION:
        nextPhase = GamePhase.RESOLUTION;
        break;
      case GamePhase.RESOLUTION:
        nextPhase = GamePhase.INTERMISSION;
        break;
      case GamePhase.INTERMISSION:
        nextPhase = GamePhase.PREPARATION;
        break;
      default:
        nextPhase = GamePhase.PREPARATION;
    }

    this.currentPhase = nextPhase;
    this.startPhase(nextPhase);
  }

  /**
   * Stop the turn manager
   */
  public stop(): void {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
      this.phaseTimeout = null;
    }
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
      this.actionProcessingInterval = null;
    }
    
    this.emit('turnManagerStopped', {
      finalCycle: this.currentCycleNumber,
      timestamp: new Date()
    });
  }
}
