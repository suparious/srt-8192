import { EventEmitter } from 'events';
import {
  GamePhase,
  GameState,
  GameAction,
  PlayerId,
  ActionStatus,
  GameEvent,
  GameEventType,
  EventVisibility,
  ServerGameCycle
} from './types';

interface GameLoopConfig {
  cycleLength: number;
  phaseConfig: {
    preparation: number;
    action: number;
    resolution: number;
    intermission: number;
  };
  maxPlayersPerGame: number;
  maxActionsPerPhase: number;
}

export class GameLoop extends EventEmitter {
  private gameState: GameState;
  private currentPhase: GamePhase;
  private phaseTimer: NodeJS.Timeout | null;
  private actionProcessingInterval: NodeJS.Timeout | null;
  private readonly config: GameLoopConfig;
  private cycleStartTime: Date;
  private lastUpdateTime: Date;
  private isPaused: boolean;

  constructor(gameState: GameState, config?: Partial<GameLoopConfig>) {
    super();
    this.gameState = gameState;
    this.config = {
      cycleLength: 8192,
      phaseConfig: {
        preparation: 300,  // 5 minutes
        action: 600,      // 10 minutes
        resolution: 300,  // 5 minutes
        intermission: 120 // 2 minutes
      },
      maxPlayersPerGame: 100,
      maxActionsPerPhase: 10,
      ...config
    };
    this.currentPhase = GamePhase.INTERMISSION;
    this.cycleStartTime = new Date();
    this.lastUpdateTime = new Date();
    this.isPaused = false;
    this.phaseTimer = null;
    this.actionProcessingInterval = null;
  }

  /**
   * Start the game loop
   */
  public start(): void {
    this.cycleStartTime = new Date();
    this.startNewCycle();
    this.startActionProcessing();
    this.emit('gameLoopStarted', this.getCurrentCycle());
  }

  /**
   * Pause the game loop
   */
  public pause(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
      this.actionProcessingInterval = null;
    }
    
    this.emit('gameLoopPaused', {
      phase: this.currentPhase,
      timestamp: new Date()
    });
  }

  /**
   * Resume the game loop
   */
  public resume(): void {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.lastUpdateTime = new Date();
    this.startPhase(this.currentPhase);
    this.startActionProcessing();
    
    this.emit('gameLoopResumed', {
      phase: this.currentPhase,
      timestamp: new Date()
    });
  }

  /**
   * Start a new game cycle
   */
  private startNewCycle(): void {
    this.currentPhase = GamePhase.PREPARATION;
    this.startPhase(this.currentPhase);
    
    this.emit('cycleStarted', {
      cycle: this.getCurrentCycle(),
      timestamp: new Date()
    });
  }

  /**
   * Start a specific game phase
   */
  private startPhase(phase: GamePhase): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
    }

    const duration = this.config.phaseConfig[phase] * 1000;
    this.phaseTimer = setTimeout(() => {
      this.transitionToNextPhase();
    }, duration);

    this.initializePhase(phase);
    
    this.emit('phaseStarted', {
      phase,
      duration,
      timestamp: new Date()
    });
  }

  /**
   * Initialize phase-specific settings and actions
   */
  private initializePhase(phase: GamePhase): void {
    switch (phase) {
      case GamePhase.PREPARATION:
        this.handlePreparationPhase();
        break;
      case GamePhase.ACTION:
        this.handleActionPhase();
        break;
      case GamePhase.RESOLUTION:
        this.handleResolutionPhase();
        break;
      case GamePhase.INTERMISSION:
        this.handleIntermissionPhase();
        break;
    }
  }

  /**
   * Start processing queued actions
   */
  private startActionProcessing(): void {
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
    }

    this.actionProcessingInterval = setInterval(() => {
      if (!this.isPaused) {
        this.processNextAction();
      }
    }, 100); // Process actions every 100ms
  }

  /**
   * Process the next action in the queue
   */
  private async processNextAction(): Promise<void> {
    const action = this.gameState.actionQueue.find(a => 
      a.status === ActionStatus.QUEUED &&
      this.isActionValidForPhase(a.type, this.currentPhase)
    );

    if (!action) return;

    try {
      action.status = ActionStatus.PROCESSING;
      const result = await this.executeAction(action);
      
      action.status = result ? ActionStatus.COMPLETED : ActionStatus.FAILED;
      this.emit('actionProcessed', { action, success: result });
      
      // Log the action
      this.logGameEvent({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: GameEventType.PLAYER_ACTION,
        playerId: action.playerId,
        data: { action, result },
        visibility: EventVisibility.PUBLIC
      });
    } catch (error) {
      action.status = ActionStatus.FAILED;
      this.emit('actionFailed', { action, error });
    }
  }

  /**
   * Execute a game action
   */
  private async executeAction(action: GameAction): Promise<boolean> {
    const player = this.gameState.players.get(action.playerId);
    if (!player) return false;

    // Validate action
    if (!this.validateAction(action)) {
      return false;
    }

    // Apply action effects
    try {
      switch (action.type) {
        case 'MOVE':
        case 'ATTACK':
        case 'BUILD':
        case 'RESEARCH':
          // These would be handled by their respective systems
          this.emit('actionExecuted', { action, timestamp: new Date() });
          return true;
        default:
          return false;
      }
    } catch (error) {
      this.emit('actionError', { action, error });
      return false;
    }
  }

  /**
   * Validate if an action can be executed
   */
  private validateAction(action: GameAction): boolean {
    const player = this.gameState.players.get(action.playerId);
    if (!player) return false;

    // Check if player has enough resources
    if (action.resources) {
      for (const [resource, amount] of Object.entries(action.resources)) {
        if ((player.resources[resource] || 0) < amount) {
          return false;
        }
      }
    }

    // Check if action is valid for current phase
    if (!this.isActionValidForPhase(action.type, this.currentPhase)) {
      return false;
    }

    return true;
  }

  /**
   * Check if an action type is valid for the current phase
   */
  private isActionValidForPhase(actionType: string, phase: GamePhase): boolean {
    const phaseActions = {
      [GamePhase.PREPARATION]: ['BUILD', 'RESEARCH', 'UPGRADE'],
      [GamePhase.ACTION]: ['MOVE', 'ATTACK', 'DEFEND'],
      [GamePhase.RESOLUTION]: ['RETREAT', 'REINFORCE'],
      [GamePhase.INTERMISSION]: []
    };

    return phaseActions[phase].includes(actionType);
  }

  /**
   * Transition to the next game phase
   */
  private transitionToNextPhase(): void {
    const currentPhaseEndTime = new Date();
    this.emit('phaseEnded', {
      phase: this.currentPhase,
      duration: currentPhaseEndTime.getTime() - this.lastUpdateTime.getTime()
    });

    // Determine next phase
    switch (this.currentPhase) {
      case GamePhase.PREPARATION:
        this.currentPhase = GamePhase.ACTION;
        break;
      case GamePhase.ACTION:
        this.currentPhase = GamePhase.RESOLUTION;
        break;
      case GamePhase.RESOLUTION:
        this.currentPhase = GamePhase.INTERMISSION;
        break;
      case GamePhase.INTERMISSION:
        if (this.shouldStartNewCycle()) {
          this.startNewCycle();
          return;
        }
        this.currentPhase = GamePhase.PREPARATION;
        break;
    }

    this.lastUpdateTime = new Date();
    this.startPhase(this.currentPhase);
  }

  /**
   * Check if a new cycle should start
   */
  private shouldStartNewCycle(): boolean {
    const currentCycle = this.getCurrentCycle();
    return currentCycle.cycleId >= this.config.cycleLength;
  }

  /**
   * Handle preparation phase initialization
   */
  private handlePreparationPhase(): void {
    // Reset action counts
    this.gameState.players.forEach(player => {
      player.actionsRemaining = this.config.maxActionsPerPhase;
    });

    // Distribute resources
    this.emit('resourceDistribution', {
      timestamp: new Date(),
      phase: GamePhase.PREPARATION
    });
  }

  /**
   * Handle action phase initialization
   */
  private handleActionPhase(): void {
    // Update AI aggression
    const currentCycle = this.getCurrentCycle();
    const baseAggression = 0.5 + (currentCycle.cycleId / this.config.cycleLength) * 0.5;
    
    this.emit('aiAggressionUpdated', {
      level: baseAggression,
      cycle: currentCycle.cycleId
    });
  }

  /**
   * Handle resolution phase initialization
   */
  private handleResolutionPhase(): void {
    // Resolve pending actions
    const pendingActions = this.gameState.actionQueue.filter(
      action => action.status === ActionStatus.QUEUED
    );

    // Sort by priority
    pendingActions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Handle intermission phase initialization
   */
  private handleIntermissionPhase(): void {
    // Calculate and distribute rewards
    this.gameState.players.forEach(player => {
      const rewards = this.calculatePlayerRewards(player.id);
      this.emit('rewardsDistributed', {
        playerId: player.id,
        rewards,
        timestamp: new Date()
      });
    });

    // Clean up phase
    this.gameState.cleanup();
  }

  /**
   * Calculate rewards for a player
   */
  private calculatePlayerRewards(playerId: PlayerId): any {
    // Implementation would calculate rewards based on player performance
    return {
      experience: 100,
      resources: {
        energy: 50,
        materials: 50,
        technology: 25,
        intelligence: 25,
        morale: 10
      }
    };
  }

  /**
   * Get current cycle information
   */
  public getCurrentCycle(): ServerGameCycle {
    const now = new Date();
    const cycleProgress = (now.getTime() - this.cycleStartTime.getTime()) / (this.config.cycleLength * 1000);
    
    return {
      cycleId: Math.floor(cycleProgress * this.config.cycleLength),
      startTime: this.cycleStartTime,
      endTime: new Date(this.cycleStartTime.getTime() + (this.config.cycleLength * 1000)),
      currentPhase: this.currentPhase,
      phaseEndTime: new Date(this.lastUpdateTime.getTime() + (this.config.phaseConfig[this.currentPhase] * 1000)),
      totalPlayers: this.gameState.players.size,
      activePlayerCount: Array.from(this.gameState.players.values())
        .filter(p => p.isActive).length,
      aiThreatLevel: this.calculateAIThreatLevel()
    };
  }

  /**
   * Calculate current AI threat level
   */
  private calculateAIThreatLevel(): number {
    const currentCycle = Math.floor(
      (new Date().getTime() - this.cycleStartTime.getTime()) /
      (this.config.cycleLength * 1000) *
      this.config.cycleLength
    );

    // Base threat increases with cycle progress
    const baseThreat = currentCycle / this.config.cycleLength;
    
    // Modify based on world state
    const worldStateModifier = this.gameState.worldState.stability;
    
    return Math.min(1, baseThreat * (2 - worldStateModifier));
  }

  /**
   * Log a game event
   */
  private logGameEvent(event: GameEvent): void {
    this.gameState.eventLog.push(event);
    this.emit('gameEvent', event);
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.pause();
    this.emit('gameLoopStopped', {
      finalCycle: this.getCurrentCycle(),
      timestamp: new Date()
    });
  }

  /**
   * Get current phase configuration
   */
  public getCurrentPhaseConfig(): number {
    return this.config.phaseConfig[this.currentPhase];
  }

  /**
   * Get time remaining in current phase
   */
  public getPhaseTimeRemaining(): number {
    const now = new Date();
    const phaseEndTime = new Date(
      this.lastUpdateTime.getTime() +
      (this.config.phaseConfig[this.currentPhase] * 1000)
    );
    return Math.max(0, phaseEndTime.getTime() - now.getTime());
  }
}