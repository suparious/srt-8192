import { MongoClient } from 'mongodb';
import { RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import { GameCycleManager } from './core/GameCycleManager';
import { GameActionRegistry } from './core/actions/GameActionRegistry';
import { GameAction, GameSession, PlayerState } from './types/GameState';

export class GameService {
  private cycleMgr: GameCycleManager;
  private actionRegistry: GameActionRegistry;
  private mongodb: MongoClient;
  private redis: RedisClientType;
  private eventEmitter: EventEmitter;

  constructor(
    mongodb: MongoClient,
    redis: RedisClientType,
    eventEmitter: EventEmitter
  ) {
    this.mongodb = mongodb;
    this.redis = redis;
    this.eventEmitter = eventEmitter;
    this.cycleMgr = new GameCycleManager(mongodb, redis, eventEmitter);
    this.actionRegistry = new GameActionRegistry();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('cycleComplete', this.handleCycleComplete.bind(this));
    this.eventEmitter.on('gameComplete', this.handleGameComplete.bind(this));
    
    // Set up daily turn refresh at midnight server time
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.handleDailyTurnRefresh();
      // Set up recurring daily refresh
      setInterval(this.handleDailyTurnRefresh.bind(this), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  async startGame(playerIds: string[]): Promise<string> {
    const gameId = await this.cycleMgr.startGame(playerIds);
    return gameId.toString();
  }

  async submitAction(action: GameAction): Promise<boolean> {
    const actionsCollection = this.mongodb.db('game-logic').collection('actions');
    
    try {
      // Get current game state from Redis
      const gameStateKey = `game:${action.gameId}`;
      const gameData = await this.redis.hGetAll(gameStateKey);
      const playerStates = JSON.parse(gameData.playerStates || '{}');
      const playerState = playerStates[action.playerId];

      if (!playerState) {
        throw new Error('Player not found in game');
      }

      // Create action context
      const context = {
        gameId: action.gameId,
        playerId: action.playerId,
        currentCycle: parseInt(gameData.currentCycle),
        playerState,
        gameState: gameData
      };

      // Validate the action
      if (!(await this.actionRegistry.validateAction(action, context))) {
        return false;
      }

      // Store the action for processing in the next cycle
      await actionsCollection.insertOne({
        ...action,
        status: 'pending',
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error submitting action:', error);
      return false;
    }
  }

  async getGameState(gameId: string): Promise<GameSession | null> {
    const gamesCollection = this.mongodb.db('game-logic').collection('games');
    return await gamesCollection.findOne({ _id: gameId });
  }

  async getPlayerState(gameId: string, playerId: string): Promise<PlayerState | null> {
    const gameStateKey = `game:${gameId}`;
    const playerStates = JSON.parse(
      await this.redis.hGet(gameStateKey, 'playerStates') || '{}'
    );
    return playerStates[playerId] || null;
  }

  private async handleCycleComplete(data: { gameId: string; cycleNumber: number }): Promise<void> {
    // Update analytics, trigger notifications, etc.
    console.log(`Cycle ${data.cycleNumber} completed for game ${data.gameId}`);
  }

  private async handleGameComplete(data: { gameId: string }): Promise<void> {
    // Calculate final scores, update player stats, trigger rewards, etc.
    console.log(`Game ${data.gameId} completed`);
  }

  private async handleDailyTurnRefresh(): Promise<void> {
    await this.cycleMgr.addDailyTurns();
    console.log('Daily turn refresh completed');
  }

  public async shutdown(): Promise<void> {
    // Cleanup code here (stop game cycles, save state, etc.)
    console.log('Game service shutting down...');
  }
}
