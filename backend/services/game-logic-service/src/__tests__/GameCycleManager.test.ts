import { MongoClient, ObjectId } from 'mongodb';
import { RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import { GameCycleManager } from '../core/GameCycleManager';
import { GamePhase, GameStatus } from '../types/GameState';

// Mock MongoDB client
const mockMongoCollection = {
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([])
  })
};

const mockMongoDb = {
  collection: jest.fn().mockReturnValue(mockMongoCollection)
};

const mockMongoClient = {
  db: jest.fn().mockReturnValue(mockMongoDb)
} as unknown as MongoClient;

// Mock Redis client
const mockRedis = {
  hSet: jest.fn(),
  hGet: jest.fn(),
  hGetAll: jest.fn(),
  del: jest.fn()
} as unknown as RedisClientType;

describe('GameCycleManager', () => {
  let gameCycleManager: GameCycleManager;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    eventEmitter = new EventEmitter();
    gameCycleManager = new GameCycleManager(mockMongoClient, mockRedis, eventEmitter);
  });

  describe('startGame', () => {
    it('should create a new game session and store it in MongoDB and Redis', async () => {
      const playerIds = ['player1', 'player2'];
      const gameId = await gameCycleManager.startGame(playerIds);

      // Check MongoDB calls
      expect(mockMongoCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: GameStatus.IN_PROGRESS,
          players: playerIds,
          currentCycle: 0,
          totalCycles: 8192,
          currentPhase: GamePhase.PREPARATION
        })
      );

      // Check Redis calls
      expect(mockRedis.hSet).toHaveBeenCalledWith(
        `game:${gameId}`,
        expect.objectContaining({
          currentCycle: '0',
          currentPhase: GamePhase.PREPARATION
        })
      );
    });
  });

  describe('processCycle', () => {
    it('should process all phases in the correct order', async () => {
      const gameId = new ObjectId();
      const phaseEvents: GamePhase[] = [];

      // Listen for phase completion events
      eventEmitter.on('phaseComplete', ({ phase }) => {
        phaseEvents.push(phase);
      });

      // Mock Redis game data
      mockRedis.hGetAll.mockResolvedValue({
        currentCycle: '0',
        currentPhase: GamePhase.PREPARATION,
        playerStates: '{}'
      });

      // @ts-ignore - accessing private method for testing
      await gameCycleManager.processCycle(gameId);

      // Verify phases were processed in order
      expect(phaseEvents).toEqual([
        GamePhase.PREPARATION,
        GamePhase.ACTION,
        GamePhase.AI_RESPONSE,
        GamePhase.RESOLUTION
      ]);
    });

    it('should end game when max cycles reached', async () => {
      const gameId = new ObjectId();
      let gameCompleted = false;

      // Listen for game completion event
      eventEmitter.on('gameComplete', () => {
        gameCompleted = true;
      });

      // Mock Redis game data for final cycle
      mockRedis.hGetAll.mockResolvedValue({
        currentCycle: '8192',
        currentPhase: GamePhase.PREPARATION,
        playerStates: '{}'
      });

      // @ts-ignore - accessing private method for testing
      await gameCycleManager.processCycle(gameId);

      expect(gameCompleted).toBe(true);
      expect(mockMongoCollection.updateOne).toHaveBeenCalledWith(
        { _id: gameId },
        expect.objectContaining({
          $set: {
            status: GameStatus.COMPLETED
          }
        })
      );
    });
  });

  describe('addDailyTurns', () => {
    it('should add turns up to the maximum limit', async () => {
      const gameId = new ObjectId();
      const playerState = {
        player1: {
          turnsRemaining: 70,
          resources: {
            energy: 1000,
            materials: 1000,
            technology: 0,
            intelligence: 0,
            morale: 100
          }
        }
      };

      // Mock active games query
      mockMongoCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { _id: gameId, status: GameStatus.IN_PROGRESS }
        ])
      });

      // Mock Redis player state
      mockRedis.hGet.mockResolvedValue(JSON.stringify(playerState));

      await gameCycleManager.addDailyTurns();

      // Verify Redis update
      expect(mockRedis.hSet).toHaveBeenCalledWith(
        `game:${gameId}`,
        'playerStates',
        expect.stringContaining('"turnsRemaining":75') // Max turns limit
      );
    });

    it('should add daily turns to all active games', async () => {
      const gameIds = [new ObjectId(), new ObjectId()];
      
      // Mock multiple active games
      mockMongoCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { _id: gameIds[0], status: GameStatus.IN_PROGRESS },
          { _id: gameIds[1], status: GameStatus.IN_PROGRESS }
        ])
      });

      // Mock empty player states
      mockRedis.hGet.mockResolvedValue('{}');

      await gameCycleManager.addDailyTurns();

      // Verify Redis was called for each game
      expect(mockRedis.hGet).toHaveBeenCalledTimes(2);
      expect(mockRedis.hSet).toHaveBeenCalledTimes(2);
    });
  });
});
