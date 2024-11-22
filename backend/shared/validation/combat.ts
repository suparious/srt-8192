import { z } from 'zod';
import { ResourceType } from '../types/game';

/**
 * Combat action validation schemas
 */

// Basic position validation
const positionSchema = z.object({
  x: z.number().int(),
  y: z.number().int()
});

// Unit selection validation
const unitSelectionSchema = z.object({
  unitId: z.string().uuid(),
  formationPosition: positionSchema.optional()
});

// Resource cost validation
const resourceCostSchema = z.object({
  [ResourceType.ENERGY]: z.number().min(0).optional(),
  [ResourceType.MATERIALS]: z.number().min(0).optional(),
  [ResourceType.TECHNOLOGY]: z.number().min(0).optional(),
  [ResourceType.INTELLIGENCE]: z.number().min(0).optional(),
  [ResourceType.MORALE]: z.number().min(0).optional()
});

// Combat ability usage validation
const abilityUsageSchema = z.object({
  abilityId: z.string().uuid(),
  targetUnitIds: z.array(z.string().uuid()),
  resourceCost: resourceCostSchema
});

// Combat formation validation
const formationSchema = z.object({
  name: z.string(),
  units: z.array(unitSelectionSchema),
  resourceCost: resourceCostSchema.optional()
});

// Combat action validation
export const combatActionSchema = z.object({
  actionId: z.string().uuid(),
  attackerId: z.string().uuid(),
  targetRegionId: z.string().uuid(),
  formation: formationSchema,
  abilities: z.array(abilityUsageSchema).optional(),
  timestamp: z.date(),
  options: z.object({
    allowRetreat: z.boolean().default(true),
    useSpecialAbilities: z.boolean().default(true),
    prioritizeTargets: z.boolean().default(false)
  }).optional()
});

// Combat result validation
export const combatResultSchema = z.object({
  actionId: z.string().uuid(),
  attackerId: z.string().uuid(),
  defenderId: z.string().uuid(),
  regionId: z.string().uuid(),
  territoryChanged: z.boolean(),
  units: z.array(z.object({
    unitId: z.string().uuid(),
    startingHealth: z.number().min(0).max(100),
    endingHealth: z.number().min(0).max(100),
    experienceGained: z.number().min(0),
    destroyed: z.boolean()
  })),
  resourcesLost: resourceCostSchema,
  timestamp: z.date(),
  strategicValue: z.number().min(0)
});

// Combat validation functions
export const combatValidation = {
  /**
   * Validate a combat action
   */
  validateCombatAction(action: unknown) {
    return combatActionSchema.safeParse(action);
  },

  /**
   * Validate a combat result
   */
  validateCombatResult(result: unknown) {
    return combatResultSchema.safeParse(result);
  },

  /**
   * Validate formation composition
   * Checks unit types, positions, and resource costs
   */
  validateFormation(formation: unknown) {
    const result = formationSchema.safeParse(formation);
    if (!result.success) {
      return result;
    }

    // Additional formation-specific validations
    const { units } = result.data;
    
    // Check for duplicate unit IDs
    const unitIds = new Set();
    for (const unit of units) {
      if (unitIds.has(unit.unitId)) {
        return {
          success: false,
          error: new Error('Duplicate unit IDs in formation')
        };
      }
      unitIds.add(unit.unitId);
    }

    // Check for valid formation positions if specified
    if (units.some(u => u.formationPosition)) {
      const positions = new Set();
      for (const unit of units) {
        if (unit.formationPosition) {
          const pos = `${unit.formationPosition.x},${unit.formationPosition.y}`;
          if (positions.has(pos)) {
            return {
              success: false,
              error: new Error('Overlapping unit positions in formation')
            };
          }
          positions.add(pos);
        }
      }
    }

    return result;
  },

  /**
   * Validate ability usage
   * Checks ability types, targets, and resource costs
   */
  validateAbilityUsage(ability: unknown) {
    const result = abilityUsageSchema.safeParse(ability);
    if (!result.success) {
      return result;
    }

    // Additional ability-specific validations
    const { targetUnitIds, resourceCost } = result.data;

    // Check for valid number of targets
    if (targetUnitIds.length === 0) {
      return {
        success: false,
        error: new Error('Ability must have at least one target')
      };
    }

    // Check for sufficient resources
    if (resourceCost) {
      for (const [resource, amount] of Object.entries(resourceCost)) {
        if (amount < 0) {
          return {
            success: false,
            error: new Error(`Invalid negative resource cost for ${resource}`)
          };
        }
      }
    }

    return result;
  },

  /**
   * Validate combat resolution
   * Ensures all units are accounted for and results are consistent
   */
  validateCombatResolution(
    action: z.infer<typeof combatActionSchema>,
    result: z.infer<typeof combatResultSchema>
  ) {
    // Check that all units from the action are accounted for in the result
    const actionUnitIds = new Set(action.formation.units.map(u => u.unitId));
    const resultUnitIds = new Set(result.units.map(u => u.unitId));

    for (const unitId of actionUnitIds) {
      if (!resultUnitIds.has(unitId)) {
        return {
          success: false,
          error: new Error(`Missing unit ${unitId} in combat result`)
        };
      }
    }

    // Validate unit health changes
    for (const unit of result.units) {
      if (unit.endingHealth > unit.startingHealth) {
        return {
          success: false,
          error: new Error(`Invalid health increase for unit ${unit.unitId}`)
        };
      }
      if (unit.destroyed && unit.endingHealth > 0) {
        return {
          success: false,
          error: new Error(`Destroyed unit ${unit.unitId} has remaining health`)
        };
      }
    }

    // Validate resources
    for (const [resource, amount] of Object.entries(result.resourcesLost)) {
      if (amount < 0) {
        return {
          success: false,
          error: new Error(`Invalid negative resource loss for ${resource}`)
        };
      }
    }

    return { success: true, data: result };
  }
};