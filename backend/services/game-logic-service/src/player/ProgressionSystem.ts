import { EventEmitter } from 'events';
import {
  PlayerId,
  LeadershipSkill,
  LeadershipStats,
  ResourceCost,
  CombatResult,
  GameEvent,
  GameEventType,
  EventVisibility
} from '../types';

interface SkillProgression {
  level: number;
  experience: number;
  nextLevelThreshold: number;
}

interface ProgressionConfig {
  baseExperience: {
    combat: number;
    resource: number;
    diplomatic: number;
    research: number;
  };
  levelThresholds: number[];
  maxLevel: number;
  skillMultipliers: Record<LeadershipSkill, number>;
}

export class ProgressionSystem extends EventEmitter {
  private playerProgress: Map<PlayerId, Record<LeadershipSkill, SkillProgression>>;
  private readonly config: ProgressionConfig;

  constructor() {
    super();
    this.playerProgress = new Map();
    this.config = this.initializeConfig();
  }

  private initializeConfig(): ProgressionConfig {
    return {
      baseExperience: {
        combat: 100,
        resource: 50,
        diplomatic: 75,
        research: 60
      },
      levelThresholds: this.generateLevelThresholds(),
      maxLevel: 50,
      skillMultipliers: {
        [LeadershipSkill.STRATEGY]: 1.2,
        [LeadershipSkill.DIPLOMACY]: 1.0,
        [LeadershipSkill.ECONOMICS]: 1.1,
        [LeadershipSkill.MILITARY]: 1.3,
        [LeadershipSkill.RESEARCH]: 1.0
      }
    };
  }

  private generateLevelThresholds(): number[] {
    const thresholds: number[] = [];
    let baseXP = 1000;
    const multiplier = 1.5;

    for (let i = 0; i < 50; i++) {
      thresholds.push(Math.floor(baseXP));
      baseXP *= multiplier;
    }

    return thresholds;
  }

  /**
   * Initialize progression tracking for a new player
   */
  public initializePlayer(playerId: PlayerId): void {
    if (!this.playerProgress.has(playerId)) {
      const initialProgress: Record<LeadershipSkill, SkillProgression> = {} as Record<LeadershipSkill, SkillProgression>;

      Object.values(LeadershipSkill).forEach(skill => {
        initialProgress[skill] = {
          level: 1,
          experience: 0,
          nextLevelThreshold: this.config.levelThresholds[0]
        };
      });

      this.playerProgress.set(playerId, initialProgress);
      this.emitProgressEvent(playerId, 'progression_initialized');
    }
  }

  /**
   * Award combat experience based on battle results
   */
  public awardCombatExperience(playerId: PlayerId, result: CombatResult): void {
    const baseXP = this.config.baseExperience.combat;
    let experienceGained = baseXP;

    // Modify XP based on battle outcome
    if (result.territoryChanged) {
      experienceGained *= 1.5;
    }

    // Add strategic value bonus
    experienceGained += result.strategicValue * 0.5;

    this.awardExperience(playerId, LeadershipSkill.MILITARY, experienceGained);
    this.awardExperience(playerId, LeadershipSkill.STRATEGY, experienceGained * 0.5);
  }

  /**
   * Award experience for resource management
   */
  public awardResourceExperience(
    playerId: PlayerId,
    resources: ResourceCost,
    efficiency: number
  ): void {
    const baseXP = this.config.baseExperience.resource;
    const totalResources = Object.values(resources).reduce((sum, value) => sum + value, 0);

    let experienceGained = baseXP * (totalResources / 1000) * efficiency;
    this.awardExperience(playerId, LeadershipSkill.ECONOMICS, experienceGained);
  }

  /**
   * Award experience for diplomatic actions
   */
  public awardDiplomaticExperience(
    playerId: PlayerId,
    success: boolean,
    importance: number
  ): void {
    const baseXP = this.config.baseExperience.diplomatic;
    let experienceGained = baseXP * importance;

    if (success) {
      experienceGained *= 1.5;
    }

    this.awardExperience(playerId, LeadershipSkill.DIPLOMACY, experienceGained);
  }

  /**
   * Award experience for research activities
   */
  public awardResearchExperience(
    playerId: PlayerId,
    techLevel: number,
    completion: number
  ): void {
    const baseXP = this.config.baseExperience.research;
    const experienceGained = baseXP * techLevel * completion;

    this.awardExperience(playerId, LeadershipSkill.RESEARCH, experienceGained);
  }

  /**
   * Award experience to a specific skill
   */
  private awardExperience(
    playerId: PlayerId,
    skill: LeadershipSkill,
    amount: number
  ): void {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return;

    const skillProgress = progress[skill];
    const multiplier = this.config.skillMultipliers[skill];
    const adjustedAmount = amount * multiplier;

    skillProgress.experience += adjustedAmount;

    // Check for level up
    while (skillProgress.experience >= skillProgress.nextLevelThreshold) {
      if (skillProgress.level >= this.config.maxLevel) {
        skillProgress.experience = skillProgress.nextLevelThreshold;
        break;
      }

      skillProgress.experience -= skillProgress.nextLevelThreshold;
      skillProgress.level++;
      skillProgress.nextLevelThreshold = this.config.levelThresholds[skillProgress.level - 1];

      this.emitProgressEvent(playerId, 'skill_level_up', {
        skill,
        newLevel: skillProgress.level
      });
    }

    this.emitProgressEvent(playerId, 'experience_gained', {
      skill,
      amount: adjustedAmount
    });
  }

  /**
   * Get current progression for a player
   */
  public getPlayerProgress(playerId: PlayerId): Record<LeadershipSkill, SkillProgression> | undefined {
    return this.playerProgress.get(playerId);
  }

  /**
   * Get skill level for a specific skill
   */
  public getSkillLevel(playerId: PlayerId, skill: LeadershipSkill): number {
    return this.playerProgress.get(playerId)?.[skill]?.level || 1;
  }

  /**
   * Calculate skill bonus for gameplay effects
   */
  public calculateSkillBonus(playerId: PlayerId, skill: LeadershipSkill): number {
    const level = this.getSkillLevel(playerId, skill);
    // Each level provides a 2% bonus, up to 100% at max level
    return 1 + (Math.min(level, this.config.maxLevel) * 0.02);
  }

  /**
   * Emit progression-related events
   */
  private emitProgressEvent(
    playerId: PlayerId,
    type: string,
    data?: Record<string, any>
  ): void {
    const event: GameEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.PLAYER_ACTION,
      playerId,
      data: {
        progressionType: type,
        ...data
      },
      visibility: EventVisibility.PLAYER
    };

    this.emit('progressionEvent', event);
  }

  /**
   * Reset progression for testing purposes
   */
  public resetProgress(playerId: PlayerId): void {
    this.playerProgress.delete(playerId);
    this.initializePlayer(playerId);
  }
}

export interface LeadershipMetrics {
  strategicDecisions: {
    successfulPlannings: number;
    failedStrategies: number;
    adaptationRate: number;
  };
  resourceManagement: {
    allocationEfficiency: number;
    wasteRate: number;
    optimizationScore: number;
  };
}