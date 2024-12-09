import { ObjectId } from 'mongodb';

export enum GamePhase {
  PREPARATION = 'PREPARATION',
  ACTION = 'ACTION',
  AI_RESPONSE = 'AI_RESPONSE',
  RESOLUTION = 'RESOLUTION'
}

export enum GameStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface PlayerState {
  playerId: string;
  turnsRemaining: number;
  resources: {
    energy: number;
    materials: number;
    technology: number;
    intelligence: number;
    morale: number;
  };
  territories: ObjectId[];
  units: ObjectId[];
  achievements: ObjectId[];
  lastActionTimestamp: Date;
}

export interface GameCycle {
  cycleNumber: number;
  startTime: Date;
  phase: GamePhase;
  playerStates: Map<string, PlayerState>;
  pendingActions: ObjectId[];
  completedActions: ObjectId[];
}

export interface GameSession {
  _id: ObjectId;
  status: GameStatus;
  startTime: Date;
  currentCycle: number;
  totalCycles: number;
  players: string[];
  currentPhase: GamePhase;
  cycles: GameCycle[];
  lastUpdateTime: Date;
}

export interface GameAction {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: string;
  cycleNumber: number;
  actionType: string;
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  result?: Record<string, any>;
}
