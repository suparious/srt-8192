import { EventEmitter } from 'events';
import {
  GameSession,
  ServerPlayer,
  WorldState,
  GamePhase,
  PlayerId,
  GameSessionId,
  RegionId,
  ActionId,
  QueuedAction,
  GameEvent,
  SessionStatus,
  ActionStatus,
  ServerGameCycle,
  ResourceCost,
  GameEventType,
  EventVisibility,
  WorldEventType,
  AIActivityMetrics
} from './types';

/**
 * GameState manages the core game state and provides methods for state manipulation
 * while ensuring consistency and proper event emission.
 */
export class GameState extends EventEmitter {
  private session: GameSession;
  private readonly cycleConfig = {
    maxPlayers: 100,
    minPlayers: 2,
    preparationPhaseDuration: 300, // 5 minutes
    actionPhaseDuration: 600, // 10 minutes
    resolutionPhaseDuration: 300, // 5 minutes
    intermissionDuration: 120, // 2 minutes
    maxActionsPerPlayer: 10,
    resourceBaseRate: 1.0,
    aiAggressionBaseRate: 1.0
  };

  constructor(sessionId: GameSessionId) {
    super();
    this.session = this.initializeSession(sessionId);
  }

  /**
   * Initialize a new game session with default values
   */
  private initializeSession(sessionId: GameSessionId): GameSession {
    return {
      id: sessionId,
      status: SessionStatus.INITIALIZING,
      players: new Map(),
      regions: new Map(),
      actionQueue: [],
      eventLog: [],
      worldState: this.initializeWorldState(),
      startTime: new Date(),
      lastUpdateTime: new Date()
    };
  }

  /**
   * Initialize the world state with default values
   */
  private initializeWorldState(): WorldState {
    return {
      globalStability: 1.0,
      resourceAvailability: {
        energy: 1.0,
        materials: 1.0,
        technology: 1.0,
        intelligence: 1.0,
        morale: 1.0
      },
      activeEvents: [],
      aiActivity: {
        aggressionLevel: 0.5,
        expansionRate: 0.1,
        techProgress: 0,
        targetedRegions: [],
        predictedNextActions: []
      },
      temperature: 20,
      weatherConditions: []
    };
  }

  /**
   * Get current game session state
   */
  public getSessionState(): Readonly<GameSession> {
    return Object.freeze({ ...this.session });
  }

  /**
   * Add a player to the game session
   */
  public addPlayer(player: ServerPlayer): boolean {
    if (this.session.players.size >= this.cycleConfig.maxPlayers) {
      return false;
    }

    this.session.players.set(player.id, player);
    this.emit('playerJoined', player.id);
    
    this.logGameEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.PLAYER_ACTION,
      playerId: player.id,
      data: { action: 'join' },
      visibility: EventVisibility.PUBLIC
    });

    return true;
  }

  /**
   * Remove a player from the game session
   */
  public removePlayer(playerId: PlayerId): boolean {
    const player = this.session.players.get(playerId);
    if (!player) {
      return false;
    }

    this.session.players.delete(playerId);
    this.emit('playerLeft', playerId);
    
    this.logGameEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.PLAYER_ACTION,
      playerId: playerId,
      data: { action: 'leave' },
      visibility: EventVisibility.PUBLIC
    });

    return true;
  }

  /**
   * Queue an action for processing
   */
  public queueAction(action: QueuedAction): boolean {
    const player = this.session.players.get(action.playerId);
    if (!player) {
      return false;
    }

    const playerActions = this.session.actionQueue.filter(
      a => a.playerId === action.playerId && 
      a.status !== ActionStatus.COMPLETED && 
      a.status !== ActionStatus.FAILED
    );

    if (playerActions.length >= this.cycleConfig.maxActionsPerPlayer) {
      return false;
    }

    this.session.actionQueue.push(action);
    this.emit('actionQueued', action);
    return true;
  }

  /**
   * Process the next action in the queue
   */
  public async processNextAction(): Promise<boolean> {
    const action = this.session.actionQueue.find(a => a.status === ActionStatus.QUEUED);
    if (!action) {
      return false;
    }

    action.status = ActionStatus.PROCESSING;
    
    try {
      // Process the action based on its type
      const result = await this.processAction(action);
      
      action.status = result ? ActionStatus.COMPLETED : ActionStatus.FAILED;
      this.emit('actionProcessed', { action, success: result });
      
      return result;
    } catch (error) {
      action.status = ActionStatus.FAILED;
      this.emit('actionFailed', { action, error });
      return false;
    }
  }

  /**
   * Update the world state with new events and conditions
   */
  public updateWorldState(partialState: Partial<WorldState>): void {
    this.session.worldState = {
      ...this.session.worldState,
      ...partialState,
      lastUpdateTime: new Date()
    };

    this.emit('worldStateUpdated', this.session.worldState);
  }

  /**
   * Update AI activity metrics and process AI actions
   */
  public updateAIActivity(metrics: AIActivityMetrics): void {
    this.session.worldState.aiActivity = metrics;
    
    if (metrics.aggressionLevel > 0.8) {
      this.triggerWorldEvent(WorldEventType.AI_UPRISING);
    }

    this.emit('aiActivityUpdated', metrics);
  }

  /**
   * Trigger a world event and apply its effects
   */
  private triggerWorldEvent(eventType: WorldEventType): void {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      severity: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      affectedRegions: Array.from(this.session.regions.keys()),
      duration: 300, // 5 minutes
      effects: []
    };

    this.session.worldState.activeEvents.push(event);
    this.emit('worldEventTriggered', event);
    
    this.logGameEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.WORLD_EVENT,
      data: { event },
      visibility: EventVisibility.PUBLIC
    });
  }

  /**
   * Calculate and distribute resources to players
   */
  public distributeResources(): void {
    for (const [playerId, player] of this.session.players) {
      const baseResources: ResourceCost = {
        energy: 100,
        materials: 100,
        technology: 50,
        intelligence: 25,
        morale: 10
      };

      const multiplier = this.session.worldState.resourceAvailability;
      const finalResources: ResourceCost = {
        energy: baseResources.energy * multiplier.energy,
        materials: baseResources.materials * multiplier.materials,
        technology: baseResources.technology * multiplier.technology,
        intelligence: baseResources.intelligence * multiplier.intelligence,
        morale: baseResources.morale * multiplier.morale
      };

      // Update player's game state with new resources
      player.gameState.resources = this.addResources(
        player.gameState.resources,
        finalResources
      );

      this.emit('resourcesDistributed', { playerId, resources: finalResources });
    }
  }

  /**
   * Helper method to add resources together
   */
  private addResources(current: ResourceCost, added: ResourceCost): ResourceCost {
    return {
      energy: current.energy + added.energy,
      materials: current.materials + added.materials,
      technology: current.technology + added.technology,
      intelligence: current.intelligence + added.intelligence,
      morale: current.morale + added.morale
    };
  }

  /**
   * Process a single action
   */
  private async processAction(action: QueuedAction): Promise<boolean> {
    // Implementation would vary based on action type
    // This is a placeholder for the actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate action processing
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          this.logGameEvent({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: GameEventType.PLAYER_ACTION,
            playerId: action.playerId,
            data: { action, result: 'success' },
            visibility: EventVisibility.PLAYER
          });
        }
        resolve(success);
      }, 100);
    });
  }

  /**
   * Log a game event
   */
  private logGameEvent(event: GameEvent): void {
    this.session.eventLog.push(event);
    this.emit('gameEvent', event);
  }

  /**
   * Get the current game cycle information
   */
  public getCurrentCycle(): ServerGameCycle {
    const currentPhase = this.calculateCurrentPhase();
    const phaseEndTime = this.calculatePhaseEndTime(currentPhase);

    return {
      cycleId: Math.floor((Date.now() - this.session.startTime.getTime()) / 
        (this.getTotalCycleDuration() * 1000)),
      startTime: this.session.startTime,
      endTime: new Date(this.session.startTime.getTime() + 8192 * 1000),
      currentPhase,
      phaseEndTime,
      totalPlayers: this.session.players.size,
      activePlayerCount: Array.from(this.session.players.values())
        .filter(p => p.connectionStatus === 'connected').length,
      aiThreatLevel: this.session.worldState.aiActivity.aggressionLevel
    };
  }

  /**
   * Calculate the current game phase based on time
   */
  private calculateCurrentPhase(): GamePhase {
    const cycleTime = (Date.now() - this.session.startTime.getTime()) % 
      this.getTotalCycleDuration();
    
    if (cycleTime < this.cycleConfig.preparationPhaseDuration) {
      return GamePhase.PREPARATION;
    } else if (cycleTime < this.cycleConfig.preparationPhaseDuration + 
      this.cycleConfig.actionPhaseDuration) {
      return GamePhase.ACTION;
    } else if (cycleTime < this.cycleConfig.preparationPhaseDuration + 
      this.cycleConfig.actionPhaseDuration + 
      this.cycleConfig.resolutionPhaseDuration) {
      return GamePhase.RESOLUTION;
    } else {
      return GamePhase.INTERMISSION;
    }
  }

  /**
   * Calculate when the current phase ends
   */
  private calculatePhaseEndTime(phase: GamePhase): Date {
    const cycleStart = Math.floor((Date.now() - this.session.startTime.getTime()) / 
      this.getTotalCycleDuration()) * this.getTotalCycleDuration() + 
      this.session.startTime.getTime();
    
    let phaseEnd = cycleStart;
    switch (phase) {
      case GamePhase.PREPARATION:
        phaseEnd += this.cycleConfig.preparationPhaseDuration * 1000;
        break;
      case GamePhase.ACTION:
        phaseEnd += (this.cycleConfig.preparationPhaseDuration + 
          this.cycleConfig.actionPhaseDuration) * 1000;
        break;
      case GamePhase.RESOLUTION:
        phaseEnd += (this.cycleConfig.preparationPhaseDuration + 
          this.cycleConfig.actionPhaseDuration + 
          this.cycleConfig.resolutionPhaseDuration) * 1000;
        break;
      case GamePhase.INTERMISSION:
        phaseEnd += this.getTotalCycleDuration() * 1000;
        break;
    }
    
    return new Date(phaseEnd);
  }

  /**
   * Get the total duration of a game cycle in seconds
   */
  private getTotalCycleDuration(): number {
    return this.cycleConfig.preparationPhaseDuration + 
      this.cycleConfig.actionPhaseDuration + 
      this.cycleConfig.resolutionPhaseDuration + 
      this.cycleConfig.intermissionDuration;
  }

  /**
   * Clean up old events and actions
   */
  public cleanup(): void {
    const MAX_EVENTS = 1000;
    const MAX_ACTION_AGE = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old events
    if (this.session.eventLog.length > MAX_EVENTS) {
      this.session.eventLog = this.session.eventLog.slice(-MAX_EVENTS);
    }

    // Clean up old actions
    const now = Date.now();
    this.session.actionQueue = this.session.actionQueue.filter(action => 
      now - action.timestamp.getTime() < MAX_ACTION_AGE || 
      action.status === ActionStatus.QUEUED || 
      action.status === ActionStatus.PROCESSING
    );
  }
}