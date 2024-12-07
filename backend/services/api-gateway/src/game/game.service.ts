import { Injectable, Logger } from '@nestjs/common';
import { ServiceRegistry } from '../service-registry/service-registry.service';
import { SubmitActionDto } from './dto/submit-action.dto';
import { GameCycleManager } from './game-cycle.manager';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly cycleManager: GameCycleManager;

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
  ) {
    this.cycleManager = new GameCycleManager();
  }

  async submitAction(action: SubmitActionDto) {
    try {
      // Validate current game cycle
      const currentCycle = this.cycleManager.getCurrentCycle();
      if (!this.cycleManager.canSubmitAction(action)) {
        throw new Error('Action cannot be submitted at this time');
      }

      // Route action to appropriate service
      const service = await this.serviceRegistry.getServiceForAction(action.type);
      const result = await service.processAction(action);

      // Queue action for end-of-cycle processing
      this.cycleManager.queueAction(action);

      return result;
    } catch (error) {
      this.logger.error(`Error processing action: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getGameState(gameId: string) {
    try {
      const gameLogicService = await this.serviceRegistry.getService('game-logic');
      return await gameLogicService.getGameState(gameId);
    } catch (error) {
      this.logger.error(`Error getting game state: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getGameCycle(gameId: string) {
    return {
      currentCycle: this.cycleManager.getCurrentCycle(),
      nextCycleIn: this.cycleManager.getTimeUntilNextCycle(),
      totalCycles: this.cycleManager.getTotalCycles(),
      actionsQueued: this.cycleManager.getQueuedActionCount(gameId),
    };
  }

  async getActivePlayers(gameId: string) {
    try {
      const gameLogicService = await this.serviceRegistry.getService('game-logic');
      return await gameLogicService.getActivePlayers(gameId);
    } catch (error) {
      this.logger.error(`Error getting active players: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processEndOfCycle() {
    try {
      const queuedActions = this.cycleManager.getQueuedActions();
      const gameLogicService = await this.serviceRegistry.getService('game-logic');
      
      // Process all queued actions in batch
      const results = await gameLogicService.processActions(queuedActions);
      
      // Clear the queue after processing
      this.cycleManager.clearQueue();
      
      return results;
    } catch (error) {
      this.logger.error(`Error processing end of cycle: ${error.message}`, error.stack);
      throw error;
    }
  }
}