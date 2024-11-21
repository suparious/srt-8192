import { EventEmitter } from 'events';
import { GameState } from './GameState';
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
} from './types';

export class TurnManager extends EventEmitter {
  private gameState: GameState;
  private currentPhase: GamePhase;
  private phaseTimeout: NodeJS.Timeout | null = null;
  private actionProcessingInterval: NodeJS.Timeout | null = null;

  private readonly phaseConfigs: Record<GamePhase, PhaseConfig> = {
    [GamePhase.PREPARATION]: {
      duration: 300, // 5 minutes
      maxActionsPerPlayer: 5,
      resourceMultiplier: 1.5,
      aiAggressionMultiplier: 0.5
    },
    [GamePhase.ACTION]: {
      duration: 600, // 10 minutes
      maxActionsPerPlayer: 10,
      resourceMultiplier: 1.0,
      aiAggressionMultiplier: 1.0
    },
    [GamePhase.RESOLUTION]: {
      duration: 300, // 5 minutes
      maxActionsPerPlayer: 3,
      resourceMultiplier: 0.5,
      aiAggressionMultiplier: 1.5
    },
    [GamePhase.INTERMISSION]: {
      duration: 120, // 2 minutes
      maxActionsPerPlayer: 0,
      resourceMultiplier: 0.0,
      aiAggressionMultiplier: 0.0
    }
  };

  constructor(gameState: GameState) {
    super();
    this.gameState = gameState;
    this.currentPhase = GamePhase.INTERMISSION;
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
    this.currentPhase = GamePhase.PREPARATION;
    this.emit('cycleStarted', this.gameState.getCurrentCycle());
    this.startPhase(this.currentPhase);
    this.startActionProcessing();
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
      timestamp: new Date()
    });
  }

  /**
   * Initialize a new phase
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
   * Start processing actions from the queue
   */
  private startActionProcessing(): void {
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
    }

    this.actionProcessingInterval = setInterval(async () => {
      if (this.currentPhase !== GamePhase.INTERMISSION) {
        await this.gameState.processNextAction();
      }
    }, 100); // Process actions every 100ms
  }

  /**
   * Handle the preparation phase initialization
   */
  private handlePreparationPhase(): void {
    // Distribute initial resources
    this.gameState.distributeResources();

    // Reset action counts for all players
    const session = this.gameState.getSessionState();
    session.players.forEach(player => {
      player.gameState.actionsRemaining = this.phaseConfigs[GamePhase.PREPARATION].maxActionsPerPlayer;
    });
  }

  /**
   * Handle the action phase initialization
   */
  private handleActionPhase(): void {
    // Update AI aggression
    const currentCycle = this.gameState.getCurrentCycle();
    const baseAggression = 0.5 + (currentCycle.cycleId / 8192) * 0.5;
    
    this.gameState.updateAIActivity({
      aggressionLevel: baseAggression * this.phaseConfigs[GamePhase.ACTION].aiAggressionMultiplier,
      expansionRate: 0.1,
      techProgress: currentCycle.cycleId / 8192,
      targetedRegions: [],
      predictedNextActions: []
    });
  }

  /**
   * Handle the resolution phase initialization
   */
  private handleResolutionPhase(): void {
    // Resolve all pending actions
    const session = this.gameState.getSessionState();
    const pendingActions = session.actionQueue.filter(
      action => action.status === ActionStatus.QUEUED
    );

    // Prioritize and process remaining actions
    pendingActions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Handle the intermission phase initialization
   */
  private handleIntermissionPhase(): void {
    // Clean up old events and actions
    this.gameState.cleanup();

    // Calculate and distribute rewards
    this.calculateCycleRewards();
  }

  /**
   * End the current phase and transition to the next
   */
  private endPhase(phase: GamePhase): void {
    this.emit('phaseEnded', {
      phase,
      timestamp: new Date()
    });

    // Determine next phase
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
   * Handle a queued action
   */
  private handleActionQueued(action: QueuedAction): void {
    const config = this.phaseConfigs[this.currentPhase];
    const session = this.gameState.getSessionState();
    const player = session.players.get(action.playerId);

    if (player && player.gameState.actionsRemaining > 0) {
      player.gameState.actionsRemaining--;
      this.emit('actionAccepted', action);
    } else {
      // Mark action as failed if player is out of actions
      action.status = ActionStatus.FAILED;
      this.emit('actionRejected', {
        action,
        reason: 'No actions remaining'
      });
    }
  }

  /**
   * Handle a processed action
   */
  private handleActionProcessed(result: { action: QueuedAction, success: boolean }): void {
    const { action, success } = result;
    
    if (success) {
      this.emit('actionCompleted', action);
    } else {
      // Refund action point if action failed
      const session = this.gameState.getSessionState();
      const player = session.players.get(action.playerId);
      if (player) {
        player.gameState.actionsRemaining++;
      }
    }
  }

  /**
   * Handle world events
   */
  private handleWorldEvent(event: { type: WorldEventType }): void {
    switch (event.type) {
      case WorldEventType.AI_UPRISING:
        // Increase AI aggression temporarily
        const currentAI = this.gameState.getSessionState().worldState.aiActivity;
        this.gameState.updateAIActivity({
          ...currentAI,
          aggressionLevel: Math.min(1, currentAI.aggressionLevel * 1.5)
        });
        break;
      
      case WorldEventType.NATURAL_DISASTER:
        // Reduce resource availability temporarily
        this.gameState.updateWorldState({
          resourceAvailability: {
            energy: 0.7,
            materials: 0.7,
            technology: 0.8,
            intelligence: 0.9,
            morale: 0.6
          }
        });
        break;
    }
  }

  /**
   * Calculate and distribute cycle rewards
   */
  private calculateCycleRewards(): void {
    const session = this.gameState.getSessionState();
    const cycle = this.gameState.getCurrentCycle();

    session.players.forEach((player, playerId) => {
      // Calculate base rewards
      const baseReward = {
        experience: 100 * (cycle.cycleId + 1),
        coins: 50 * (cycle.cycleId + 1)
      };

      // Apply multipliers based on performance
      const performanceMultiplier = this.calculatePerformanceMultiplier(player.performanceMetrics);
      const finalReward = {
        experience: Math.floor(baseReward.experience * performanceMultiplier),
        coins: Math.floor(baseReward.coins * performanceMultiplier)
      };

      this.emit('rewardsCalculated', {
        playerId,
        rewards: finalReward,
        multiplier: performanceMultiplier
      });
    });
  }

  /**
   * Calculate performance multiplier for rewards
   */
  private calculatePerformanceMultiplier(metrics: any): number {
    // Implement your reward calculation logic here
    return 1.0;
  }

  /**
   * Get current phase configuration
   */
  public getCurrentPhaseConfig(): PhaseConfig {
    return this.phaseConfigs[this.currentPhase];
  }

  /**
   * Check if an action is allowed in the current phase
   */
  public isActionAllowed(actionType: ActionType): boolean {
    switch (this.currentPhase) {
      case GamePhase.PREPARATION:
        return [ActionType.BUILD, ActionType.RESEARCH].includes(actionType);
      case GamePhase.ACTION:
        return [ActionType.MOVE, ActionType.ATTACK, ActionType.DIPLOMATIC].includes(actionType);
      case GamePhase.RESOLUTION:
        return [ActionType.ECONOMIC].includes(actionType);
      case GamePhase.INTERMISSION:
        return false;
      default:
        return false;
    }
  }

  /**
   * Stop the turn manager and clean up
   */
  public stop(): void {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout);
    }
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
    }
    this.emit('turnManagerStopped');
  }
}