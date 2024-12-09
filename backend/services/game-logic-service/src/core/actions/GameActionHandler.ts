import { GameAction } from '../../types/GameState';
import { ObjectId } from 'mongodb';

export interface GameActionResult {
  success: boolean;
  changes: Record<string, any>;
  message?: string;
  error?: string;
}

export interface GameActionContext {
  gameId: ObjectId;
  playerId: string;
  currentCycle: number;
  playerState: Record<string, any>;
  gameState: Record<string, any>;
}

export interface GameActionHandler {
  actionType: string;
  validate(action: GameAction, context: GameActionContext): Promise<boolean>;
  execute(action: GameAction, context: GameActionContext): Promise<GameActionResult>;
  getCost(action: GameAction): number;
}

export abstract class BaseGameActionHandler implements GameActionHandler {
  abstract actionType: string;

  async validate(action: GameAction, context: GameActionContext): Promise<boolean> {
    // Basic validation common to all actions
    if (action.gameId.toString() !== context.gameId.toString()) {
      return false;
    }

    if (action.playerId !== context.playerId) {
      return false;
    }

    // Check if player has enough turns
    if (context.playerState.turnsRemaining < this.getCost(action)) {
      return false;
    }

    return true;
  }

  abstract execute(action: GameAction, context: GameActionContext): Promise<GameActionResult>;
  
  abstract getCost(action: GameAction): number;

  protected createSuccessResult(changes: Record<string, any>, message?: string): GameActionResult {
    return {
      success: true,
      changes,
      message
    };
  }

  protected createErrorResult(error: string): GameActionResult {
    return {
      success: false,
      changes: {},
      error
    };
  }
}
