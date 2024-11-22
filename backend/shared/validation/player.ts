import { z } from 'zod';
import {
  ActionType,
  PlayerId,
  RegionId,
  UnitId,
  GamePhase,
  DifficultyLevel,
  PlayStyle
} from '../types/game';
import { resourceMultiplierSchema } from './resources';
import { CYCLE_CONFIG } from '../constants/gameConfig';

/**
 * Player action schema
 */
export const playerActionSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string(),
  type: z.enum([
    ActionType.MOVE,
    ActionType.ATTACK,
    ActionType.BUILD,
    ActionType.RESEARCH,
    ActionType.DIPLOMATIC,
    ActionType.ECONOMIC
  ]),
  priority: z.number().min(0).max(1),
  timestamp: z.date(),
  data: z.object({
    sourceId: z.string(),
    targetId: z.string(),
    resources: z.record(z.number().min(0)).optional(),
    units: z.array(z.string()).optional(),
    parameters: z.record(z.unknown()).optional()
  }),
  status: z.enum([
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled'
  ])
});

export type ValidatedPlayerAction = z.infer<typeof playerActionSchema>;

/**
 * Matchmaking preferences schema
 */
export const matchmakingPreferencesSchema = z.object({
  rating: z.number().min(0).max(5000),
  preferredRegions: z.array(z.string()),
  languagePreferences: z.array(z.string()),
  playStyle: z.array(z.enum([
    PlayStyle.AGGRESSIVE,
    PlayStyle.DEFENSIVE,
    PlayStyle.DIPLOMATIC,
    PlayStyle.ECONOMIC
  ])),
  averageSessionDuration: z.number().min(0),
  difficultyPreference: z.enum([
    DifficultyLevel.EASY,
    DifficultyLevel.NORMAL,
    DifficultyLevel.HARD,
    DifficultyLevel.EXTREME
  ])
});

export type ValidatedMatchmakingPreferences = z.infer<typeof matchmakingPreferencesSchema>;

/**
 * Player settings schema
 */
export const playerSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inGame: z.boolean(),
    types: z.record(z.boolean())
  }),
  interface: z.object({
    theme: z.string(),
    soundEnabled: z.boolean(),
    musicVolume: z.number().min(0).max(1),
    sfxVolume: z.number().min(0).max(1),
    autoSave: z.boolean()
  }),
  gameplay: z.object({
    autoResolveSkirmishes: z.boolean(),
    confirmActions: z.boolean(),
    showTutorials: z.boolean(),
    difficultyPreference: z.enum([
      DifficultyLevel.EASY,
      DifficultyLevel.NORMAL,
      DifficultyLevel.HARD,
      DifficultyLevel.EXTREME
    ])
  })
});

export type ValidatedPlayerSettings = z.infer<typeof playerSettingsSchema>;

/**
 * Validate if an action is allowed in the current game phase
 */
export function validateActionInPhase(
  actionType: ActionType,
  phase: GamePhase,
  config = CYCLE_CONFIG.PHASES
): { valid: boolean; reason?: string } {
  const allowedActions: Record<GamePhase, ActionType[]> = {
    [GamePhase.PREPARATION]: [
      ActionType.BUILD,
      ActionType.RESEARCH,
      ActionType.ECONOMIC
    ],
    [GamePhase.ACTION]: [
      ActionType.MOVE,
      ActionType.ATTACK,
      ActionType.DIPLOMATIC
    ],
    [GamePhase.RESOLUTION]: [
      ActionType.ECONOMIC,
      ActionType.DIPLOMATIC
    ],
    [GamePhase.INTERMISSION]: []
  };

  if (!allowedActions[phase].includes(actionType)) {
    return {
      valid: false,
      reason: `Action type ${actionType} not allowed in ${phase} phase`
    };
  }

  return { valid: true };
}

/**
 * Validate action limits for a player
 */
export function validateActionLimits(
  playerId: PlayerId,
  phase: GamePhase,
  currentActions: number,
  config = CYCLE_CONFIG.PHASES
): { valid: boolean; reason?: string } {
  const maxActions = config[phase].MAX_ACTIONS;
  
  if (currentActions >= maxActions) {
    return {
      valid: false,
      reason: `Maximum actions (${maxActions}) reached for ${phase} phase`
    };
  }

  return { valid: true };
}

/**
 * Validate unit movement action
 */
export function validateUnitMovement(
  units: UnitId[],
  sourceRegion: RegionId,
  targetRegion: RegionId,
  movementRange: number,
  terrainPenalties: Record<string, number>
): { valid: boolean; reason?: string } {
  // Check unit count
  if (units.length === 0) {
    return {
      valid: false,
      reason: 'No units selected for movement'
    };
  }

  // Validate movement range (would use actual distance calculation in implementation)
  const distance = 1; // Placeholder for actual distance calculation
  const effectiveRange = movementRange - (terrainPenalties[targetRegion] || 0);

  if (distance > effectiveRange) {
    return {
      valid: false,
      reason: `Target region beyond movement range (${effectiveRange})`
    };
  }

  return { valid: true };
}

/**
 * Validate combat action
 */
export function validateCombatAction(
  attackerUnits: UnitId[],
  defenderRegion: RegionId,
  attackerStrength: number,
  defenderStrength: number,
  combatModifiers: Record<string, number>
): { valid: boolean; reason?: string } {
  // Check minimum attacking force
  if (attackerUnits.length === 0) {
    return {
      valid: false,
      reason: 'No units selected for combat'
    };
  }

  // Apply combat modifiers
  const effectiveAttackerStrength = attackerStrength * 
    (combatModifiers.attacker || 1);
  const effectiveDefenderStrength = defenderStrength * 
    (combatModifiers.defender || 1);

  // Validate minimum strength ratio (if applicable)
  const minimumStrengthRatio = 0.25; // Configurable
  if (effectiveAttackerStrength / effectiveDefenderStrength < minimumStrengthRatio) {
    return {
      valid: false,
      reason: 'Attacking force too weak for combat'
    };
  }

  return { valid: true };
}

/**
 * Validate diplomatic action
 */
export function validateDiplomaticAction(
  sourcePlayerId: PlayerId,
  targetPlayerId: PlayerId,
  actionType: string,
  currentRelations: Record<string, number>
): { valid: boolean; reason?: string } {
  // Check for self-interaction
  if (sourcePlayerId === targetPlayerId) {
    return {
      valid: false,
      reason: 'Cannot perform diplomatic action with self'
    };
  }

  // Check current relations
  const currentRelation = currentRelations[targetPlayerId] || 0;
  
  const actionRequirements: Record<string, number> = {
    'alliance': 75,
    'trade': 25,
    'peace': 0,
    'war': -50
  };

  if (actionType in actionRequirements) {
    const requiredRelation = actionRequirements[actionType];
    if (currentRelation < requiredRelation) {
      return {
        valid: false,
        reason: `Insufficient relations (${currentRelation}) for ${actionType}, requires ${requiredRelation}`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate research action
 */
export function validateResearchAction(
  playerId: PlayerId,
  technologyId: string,
  currentTechLevel: number,
  prerequisites: string[],
  completedResearch: Set<string>
): { valid: boolean; reason?: string } {
  // Check prerequisites
  for (const prereq of prerequisites) {
    if (!completedResearch.has(prereq)) {
      return {
        valid: false,
        reason: `Missing prerequisite technology: ${prereq}`
      };
    }
  }

  // Check technology level requirements
  const requiredLevel = 1; // This would be configured per technology
  if (currentTechLevel < requiredLevel) {
    return {
      valid: false,
      reason: `Insufficient technology level (${currentTechLevel}), requires level ${requiredLevel}`
    };
  }

  return { valid: true };
}

/**
 * Resource multiplier validation for player actions
 */
export const actionResourceMultiplierSchema = resourceMultiplierSchema.extend({
  duration: z.number().min(1),
  source: z.string(),
  target: z.string()
});

export type ValidatedActionResourceMultiplier = z.infer<typeof actionResourceMultiplierSchema>;

/**
 * Validate player profile updates
 */
export const profileUpdateSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  preferences: playerSettingsSchema.partial().optional(),
  matchmaking: matchmakingPreferencesSchema.partial().optional()
});

export type ValidatedProfileUpdate = z.infer<typeof profileUpdateSchema>;