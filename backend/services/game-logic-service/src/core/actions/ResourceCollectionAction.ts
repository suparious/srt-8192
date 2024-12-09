import { GameAction } from '../../types/GameState';
import { BaseGameActionHandler, GameActionContext, GameActionResult } from './GameActionHandler';

export interface ResourceCollectionParameters {
  resourceType: 'energy' | 'materials' | 'technology' | 'intelligence' | 'morale';
  territoryId: string;
  amount: number;
}

export class ResourceCollectionAction extends BaseGameActionHandler {
  actionType = 'COLLECT_RESOURCE';

  async validate(action: GameAction, context: GameActionContext): Promise<boolean> {
    if (!(await super.validate(action, context))) {
      return false;
    }

    const params = action.parameters as ResourceCollectionParameters;

    // Verify territory ownership
    if (!context.playerState.territories.includes(params.territoryId)) {
      return false;
    }

    // Additional resource-specific validation could go here
    // For example, checking if the territory can produce the requested resource type
    // and if the amount is within allowed limits

    return true;
  }

  async execute(action: GameAction, context: GameActionContext): Promise<GameActionResult> {
    const params = action.parameters as ResourceCollectionParameters;

    try {
      // Calculate actual resource gain (could be modified by territory bonuses, etc.)
      const actualGain = this.calculateResourceGain(params, context);

      // Create the changes object to update player state
      const changes = {
        resources: {
          ...context.playerState.resources,
          [params.resourceType]: context.playerState.resources[params.resourceType] + actualGain
        },
        turnsRemaining: context.playerState.turnsRemaining - this.getCost(action)
      };

      return this.createSuccessResult(
        changes,
        `Successfully collected ${actualGain} ${params.resourceType} from territory ${params.territoryId}`
      );
    } catch (error) {
      return this.createErrorResult(error.message);
    }
  }

  getCost(action: GameAction): number {
    // Base cost is 1 turn, but could be modified based on resource type or amount
    return 1;
  }

  private calculateResourceGain(
    params: ResourceCollectionParameters,
    context: GameActionContext
  ): number {
    // This is a simplified implementation
    // In a real game, this would consider:
    // - Territory resource generation rate
    // - Player technology levels
    // - Global modifiers
    // - Random events
    // - etc.
    
    let baseGain = params.amount;
    
    // Apply territory bonus (example)
    const territoryBonus = 1.1; // 10% bonus
    baseGain *= territoryBonus;
    
    // Apply technology bonus if collecting technology resources
    if (params.resourceType === 'technology') {
      const techLevel = context.playerState.resources.technology;
      const techBonus = 1 + (techLevel * 0.05); // 5% bonus per tech level
      baseGain *= techBonus;
    }

    // Round to prevent floating point issues
    return Math.round(baseGain);
  }
}
