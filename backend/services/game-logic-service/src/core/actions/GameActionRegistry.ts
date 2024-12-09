import { GameAction } from '../../types/GameState';
import { GameActionHandler, GameActionContext, GameActionResult } from './GameActionHandler';
import { ResourceCollectionAction } from './ResourceCollectionAction';

export class GameActionRegistry {
  private handlers: Map<string, GameActionHandler>;

  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    // Register the resource collection action
    const resourceCollectionAction = new ResourceCollectionAction();
    this.registerHandler(resourceCollectionAction);

    // Additional action handlers would be registered here
    // For example:
    // this.registerHandler(new CombatAction());
    // this.registerHandler(new BuildStructureAction());
    // this.registerHandler(new ResearchAction());
    // etc.
  }

  registerHandler(handler: GameActionHandler): void {
    if (this.handlers.has(handler.actionType)) {
      throw new Error(`Action handler for type ${handler.actionType} is already registered`);
    }
    this.handlers.set(handler.actionType, handler);
  }

  async validateAction(action: GameAction, context: GameActionContext): Promise<boolean> {
    const handler = this.getHandler(action.actionType);
    return handler.validate(action, context);
  }

  async executeAction(action: GameAction, context: GameActionContext): Promise<GameActionResult> {
    const handler = this.getHandler(action.actionType);
    try {
      if (!(await handler.validate(action, context))) {
        return {
          success: false,
          changes: {},
          error: 'Action validation failed'
        };
      }

      return await handler.execute(action, context);
    } catch (error) {
      return {
        success: false,
        changes: {},
        error: `Action execution failed: ${error.message}`
      };
    }
  }

  getActionCost(action: GameAction): number {
    const handler = this.getHandler(action.actionType);
    return handler.getCost(action);
  }

  private getHandler(actionType: string): GameActionHandler {
    const handler = this.handlers.get(actionType);
    if (!handler) {
      throw new Error(`No handler registered for action type: ${actionType}`);
    }
    return handler;
  }

  getRegisteredActionTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
