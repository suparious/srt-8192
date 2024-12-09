import { MongoClient, ObjectId } from 'mongodb';
import { RedisClientType } from 'redis';
import { GameSession, GamePhase, GameStatus, GameAction, PlayerState } from '../types/GameState';
import { EventEmitter } from 'events';

export class GameCycleManager {
  private static readonly CYCLE_DURATION_MS = 73828; // 73.828 seconds
  private static readonly MAX_CYCLES = 8192;
  private static readonly DAILY_TURNS = 50;
  private static readonly MAX_TURNS = 75;

  private mongodb: MongoClient;
  private redis: RedisClientType;
  private eventEmitter: EventEmitter;
  private activeGames: Map<string, NodeJS.Timeout>;

  constructor(mongodb: MongoClient, redis: RedisClientType, eventEmitter: EventEmitter) {
    this.mongodb = mongodb;
    this.redis = redis;
    this.eventEmitter = eventEmitter;
    this.activeGames = new Map();
  }

  async startGame(playerIds: string[]): Promise<ObjectId> {
    const gameSession: GameSession = {
      _id: new ObjectId(),
      status: GameStatus.IN_PROGRESS,
      startTime: new Date(),
      currentCycle: 0,
      totalCycles: GameCycleManager.MAX_CYCLES,
      players: playerIds,
      currentPhase: GamePhase.PREPARATION,
      cycles: [],
      lastUpdateTime: new Date()
    };

    const initialPlayerStates = new Map<string, PlayerState>();
    for (const playerId of playerIds) {
      initialPlayerStates.set(playerId, this.createInitialPlayerState(playerId));
    }

    // Store initial game state in MongoDB
    const gamesCollection = this.mongodb.db('game-logic').collection('games');
    await gamesCollection.insertOne(gameSession);

    // Store current cycle data in Redis for quick access
    await this.redis.hSet(`game:${gameSession._id}`, {
      currentCycle: '0',
      currentPhase: GamePhase.PREPARATION,
      playerStates: JSON.stringify(Array.from(initialPlayerStates.entries()))
    });

    // Start the game cycle loop
    this.startGameCycle(gameSession._id);

    return gameSession._id;
  }

  private startGameCycle(gameId: ObjectId): void {
    const cycleTimer = setInterval(async () => {
      await this.processCycle(gameId);
    }, GameCycleManager.CYCLE_DURATION_MS);

    this.activeGames.set(gameId.toString(), cycleTimer);
  }

  private async processCycle(gameId: ObjectId): Promise<void> {
    const gameData = await this.redis.hGetAll(`game:${gameId}`);
    const currentCycle = parseInt(gameData.currentCycle);

    if (currentCycle >= GameCycleManager.MAX_CYCLES) {
      await this.endGame(gameId);
      return;
    }

    // Process pending actions for the current cycle
    await this.processPhase(gameId, GamePhase.PREPARATION);
    await this.processPhase(gameId, GamePhase.ACTION);
    await this.processPhase(gameId, GamePhase.AI_RESPONSE);
    await this.processPhase(gameId, GamePhase.RESOLUTION);

    // Update cycle count and save state
    await this.advanceCycle(gameId);
  }

  private async processPhase(gameId: ObjectId, phase: GamePhase): Promise<void> {
    const actionsCollection = this.mongodb.db('game-logic').collection('actions');
    
    // Get all pending actions for this phase
    const actions = await actionsCollection
      .find({
        gameId,
        status: 'pending',
        phase
      })
      .toArray();

    // Process actions in order
    for (const action of actions) {
      await this.processAction(action);
    }

    // Emit phase completion event
    this.eventEmitter.emit('phaseComplete', {
      gameId,
      phase,
      timestamp: new Date()
    });
  }

  private async processAction(action: GameAction): Promise<void> {
    const actionsCollection = this.mongodb.db('game-logic').collection('actions');

    try {
      // Mark action as processing
      await actionsCollection.updateOne(
        { _id: action._id },
        { $set: { status: 'processing' } }
      );

      // Process the action based on type
      const result = await this.executeAction(action);

      // Mark action as completed
      await actionsCollection.updateOne(
        { _id: action._id },
        {
          $set: {
            status: 'completed',
            result,
            completedAt: new Date()
          }
        }
      );

      // Update game state in Redis
      await this.updateGameState(action.gameId, action.playerId, result);

    } catch (error) {
      // Mark action as failed
      await actionsCollection.updateOne(
        { _id: action._id },
        {
          $set: {
            status: 'failed',
            error: error.message
          }
        }
      );
    }
  }

  private async executeAction(action: GameAction): Promise<Record<string, any>> {
    // Implementation will vary based on action type
    // This is a placeholder for the actual action execution logic
    return {};
  }

  private async updateGameState(
    gameId: ObjectId,
    playerId: string,
    actionResult: Record<string, any>
  ): Promise<void> {
    const gameStateKey = `game:${gameId}`;
    const playerStates = JSON.parse(await this.redis.hGet(gameStateKey, 'playerStates') || '{}');
    
    // Update player state based on action result
    if (playerStates[playerId]) {
      // Apply changes from action result
      Object.assign(playerStates[playerId], actionResult);
      
      // Save updated state back to Redis
      await this.redis.hSet(gameStateKey, 'playerStates', JSON.stringify(playerStates));
    }
  }

  private async advanceCycle(gameId: ObjectId): Promise<void> {
    const gameStateKey = `game:${gameId}`;
    const currentCycle = parseInt(await this.redis.hGet(gameStateKey, 'currentCycle') || '0');
    
    // Update cycle in Redis
    await this.redis.hSet(gameStateKey, 'currentCycle', (currentCycle + 1).toString());
    
    // Update MongoDB with the completed cycle data
    const gamesCollection = this.mongodb.db('game-logic').collection('games');
    await gamesCollection.updateOne(
      { _id: gameId },
      {
        $inc: { currentCycle: 1 },
        $set: { lastUpdateTime: new Date() }
      }
    );

    // Emit cycle completion event
    this.eventEmitter.emit('cycleComplete', {
      gameId,
      cycleNumber: currentCycle + 1,
      timestamp: new Date()
    });
  }

  private async endGame(gameId: ObjectId): Promise<void> {
    // Clear the cycle timer
    const timer = this.activeGames.get(gameId.toString());
    if (timer) {
      clearInterval(timer);
      this.activeGames.delete(gameId.toString());
    }

    // Update game status in MongoDB
    const gamesCollection = this.mongodb.db('game-logic').collection('games');
    await gamesCollection.updateOne(
      { _id: gameId },
      {
        $set: {
          status: GameStatus.COMPLETED,
          lastUpdateTime: new Date()
        }
      }
    );

    // Clean up Redis data
    await this.redis.del(`game:${gameId}`);

    // Emit game completion event
    this.eventEmitter.emit('gameComplete', {
      gameId,
      timestamp: new Date()
    });
  }

  private createInitialPlayerState(playerId: string): PlayerState {
    return {
      playerId,
      turnsRemaining: GameCycleManager.DAILY_TURNS,
      resources: {
        energy: 1000,
        materials: 1000,
        technology: 0,
        intelligence: 0,
        morale: 100
      },
      territories: [],
      units: [],
      achievements: [],
      lastActionTimestamp: new Date()
    };
  }

  // Method to add daily turns for all players
  async addDailyTurns(): Promise<void> {
    const gamesCollection = this.mongodb.db('game-logic').collection('games');
    const activeGames = await gamesCollection
      .find({ status: GameStatus.IN_PROGRESS })
      .toArray();

    for (const game of activeGames) {
      const gameStateKey = `game:${game._id}`;
      const playerStates = JSON.parse(
        await this.redis.hGet(gameStateKey, 'playerStates') || '{}'
      );

      // Update turns for each player
      for (const [playerId, state] of Object.entries(playerStates)) {
        const currentTurns = (state as PlayerState).turnsRemaining;
        const newTurns = Math.min(
          currentTurns + GameCycleManager.DAILY_TURNS,
          GameCycleManager.MAX_TURNS
        );
        (state as PlayerState).turnsRemaining = newTurns;
      }

      // Save updated states back to Redis
      await this.redis.hSet(gameStateKey, 'playerStates', JSON.stringify(playerStates));
    }
  }
}
