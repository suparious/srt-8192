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
} from '../types';

export const CYCLE_DURATION_MS = 73828; // 73.828 seconds in milliseconds
export const TOTAL_CYCLES = 8192;
export const GAME_DURATION_MS = CYCLE_DURATION_MS * TOTAL_CYCLES;

interface GameLoopConfig {
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
  private cycleTimer: NodeJS.Timeout | null;
  private actionProcessingInterval: NodeJS.Timeout | null;
  private readonly config: GameLoopConfig;
  private cycleStartTime: Date;
  private lastUpdateTime: Date;
  private currentCycleNumber: number;
  private isPaused: boolean;

  constructor(gameState: GameState, config?: Partial<GameLoopConfig>) {
    super();
    this.gameState = gameState;
    this.config = {
      phaseConfig: {
        preparation: 29.531,  // 40% of cycle
        action: 29.531,      // 40% of cycle
        resolution: 11.074,   // 15% of cycle
        intermission: 3.692   // 5% of cycle
      },
      maxPlayersPerGame: 100,
      maxActionsPerPhase: 10,
      ...config
    };
    this.currentPhase = GamePhase.INTERMISSION;
    this.cycleStartTime = new Date();
    this.lastUpdateTime = new Date();
    this.currentCycleNumber = 0;
    this.isPaused = false;
    this.phaseTimer = null;
    this.cycleTimer = null;
    this.actionProcessingInterval = null;
  }

  /**
   * Start the game loop
   */
  public start(): void {
    this.cycleStartTime = new Date();
    this.currentCycleNumber = 0;
    this.startNewCycle();
    this.startActionProcessing();
    this.startCycleTimer();
    
    this.emit('gameLoopStarted', this.getCurrentCycle());
  }

  /**
   * Start the cycle timer
   */
  private startCycleTimer(): void {
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
    }

    this.cycleTimer = setInterval(() => {
      if (!this.isPaused) {
        this.currentCycleNumber++;
        if (this.currentCycleNumber >= TOTAL_CYCLES) {
          this.stop();
          this.emit('gameCompleted', this.getCurrentCycle());
        } else {
          this.startNewCycle();
        }
      }
    }, CYCLE_DURATION_MS);
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
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    if (this.actionProcessingInterval) {
      clearInterval(this.actionProcessingInterval);
      this.actionProcessingInterval = null;
    }
    
    this.emit('gameLoopPaused', {
      phase: this.currentPhase,
      cycle: this.currentCycleNumber,
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
    this.startCycleTimer();
    
    this.emit('gameLoopResumed', {
      phase: this.currentPhase,
      cycle: this.currentCycleNumber,
      timestamp: new Date()
    });
  }

  /**
   * Start a new game cycle
   */
  private startNewCycle(): void {
    this.currentPhase = GamePhase.PREPARATION;
    this.cycleStartTime = new Date();
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

    const duration = Math.floor(this.config.phaseConfig[phase] * 1000);
    this.phaseTimer = setTimeout(() => {
      this.transitionToNextPhase();
    }, duration);

    this.initializePhase(phase);
    
    this.emit('phaseStarted', {
      phase,
      duration,
      cycle: this.currentCycleNumber,
      timestamp: new Date()
    });
  }

  // ... [Rest of the existing methods remain the same, except for getCurrentCycle]

  /**
   * Get current cycle information
   */
  public getCurrentCycle(): ServerGameCycle {
    const now = new Date();
    const cycleElapsedTime = now.getTime() - this.cycleStartTime.getTime();
    const cycleProgress = cycleElapsedTime / CYCLE_DURATION_MS;
    
    return {
      cycleId: this.currentCycleNumber,
      startTime: this.cycleStartTime,
      endTime: new Date(this.cycleStartTime.getTime() + CYCLE_DURATION_MS),
      currentPhase: this.currentPhase,
      phaseEndTime: new Date(this.lastUpdateTime.getTime() + (this.config.phaseConfig[this.currentPhase] * 1000)),
      totalPlayers: this.gameState.players.size,
      activePlayerCount: Array.from(this.gameState.players.values())
        .filter(p => p.isActive).length,
      aiThreatLevel: this.calculateAIThreatLevel(),
      progress: cycleProgress,
      remainingCycles: TOTAL_CYCLES - this.currentCycleNumber - 1
    };
  }

  // ... [Rest of the class implementation remains the same]
}
