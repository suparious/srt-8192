import { EventEmitter } from 'events';
import {
  PlayerId,
  ServerPlayer,
  LeadershipSkill,
  LeadershipStats,
  ResourceCost,
  Resources,
  PlayerMetrics,
  CycleRewards
} from '../../types';

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: 'games_played' | 'resources_gathered' | 'regions_controlled' | 'skill_level' | 'cycle_completions';
    value: number;
  };
  reward: {
    experience: number;
    title?: string;
    badge?: string;
  };
}

interface SkillProgression {
  level: number;
  experience: number;
  nextLevelThreshold: number;
}

export interface UserProfile {
  id: PlayerId;
  username: string;
  created: Date;
  lastActive: Date;
  totalGamesPlayed: number;
  cyclesCompleted: number;
  experience: number;
  level: number;
  skillProgression: Record<LeadershipSkill, SkillProgression>;
  achievements: Set<string>;
  statistics: PlayerStatistics;
  preferences: UserPreferences;
  inventory: UserInventory;
}

interface PlayerStatistics {
  totalPlayTime: number;
  winRate: number;
  averageGameDuration: number;
  favoritePlayStyle: string;
  resourcesCollected: Resources;
  regionsControlled: number;
  alliesGained: number;
  successfulStrategies: number;
  highestAIThreatDefeated: number;
  personalBests: Record<string, number>;
}

interface UserPreferences {
  notifications: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  preferredRegions: string[];
  aiDifficulty: number;
  tutorialCompleted: boolean;
  theme: string;
}

interface UserInventory {
  coins: number;
  premium: number;
  skins: Set<string>;
  badges: Set<string>;
  titles: Set<string>;
  consumables: Map<string, number>;
}

export class UserProfileService extends EventEmitter {
  private profiles: Map<PlayerId, UserProfile>;
  private achievements: Map<string, Achievement>;
  private readonly levelThresholds: number[];
  private readonly skillLevelThresholds: number[];

  constructor() {
    super();
    this.profiles = new Map();
    this.achievements = this.initializeAchievements();
    this.levelThresholds = this.generateLevelThresholds();
    this.skillLevelThresholds = this.generateSkillLevelThresholds();
  }

  /**
   * Initialize achievements
   */
  private initializeAchievements(): Map<string, Achievement> {
    const achievements = new Map<string, Achievement>();
    
    // Add core achievements
    achievements.set('first_victory', {
      id: 'first_victory',
      name: 'First Victory',
      description: 'Win your first game',
      requirement: { type: 'games_played', value: 1 },
      reward: { experience: 100, badge: 'rookie_commander' }
    });

    achievements.set('master_strategist', {
      id: 'master_strategist',
      name: 'Master Strategist',
      description: 'Reach level 10 in Strategy skill',
      requirement: { type: 'skill_level', value: 10 },
      reward: { experience: 500, title: 'Strategist' }
    });

    achievements.set('cycle_veteran', {
      id: 'cycle_veteran',
      name: 'Cycle Veteran',
      description: 'Complete 100 game cycles',
      requirement: { type: 'cycle_completions', value: 100 },
      reward: { experience: 1000, badge: 'cycle_master' }
    });

    return achievements;
  }

  /**
   * Create a new user profile
   */
  public createProfile(id: PlayerId, username: string): UserProfile {
    if (this.profiles.has(id)) {
      throw new Error('Profile already exists');
    }

    const profile: UserProfile = {
      id,
      username,
      created: new Date(),
      lastActive: new Date(),
      totalGamesPlayed: 0,
      cyclesCompleted: 0,
      experience: 0,
      level: 1,
      skillProgression: this.initializeSkillProgression(),
      achievements: new Set(),
      statistics: this.initializeStatistics(),
      preferences: this.initializePreferences(),
      inventory: this.initializeInventory()
    };

    this.profiles.set(id, profile);
    this.emit('profileCreated', { id, username });
    return profile;
  }

  /**
   * Update user profile with game results
   */
  public updateProfileWithGameResults(
    id: PlayerId,
    metrics: PlayerMetrics,
    rewards: CycleRewards
  ): void {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update basic stats
    profile.totalGamesPlayed++;
    profile.lastActive = new Date();
    profile.cyclesCompleted++;

    // Apply rewards
    this.applyRewards(profile, rewards);

    // Update statistics
    this.updateStatistics(profile, metrics);

    // Check achievements
    this.checkAchievements(profile);

    this.emit('profileUpdated', { id, profile });
  }

  /**
   * Update leadership skills
   */
  public updateLeadershipSkill(
    id: PlayerId,
    skill: LeadershipSkill,
    experienceGained: number
  ): void {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const progression = profile.skillProgression[skill];
    const oldLevel = progression.level;
    progression.experience += experienceGained;

    while (progression.experience >= progression.nextLevelThreshold) {
      progression.level++;
      progression.experience -= progression.nextLevelThreshold;
      progression.nextLevelThreshold = this.calculateSkillThreshold(progression.level);
    }

    if (progression.level > oldLevel) {
      this.emit('skillLevelUp', {
        playerId: id,
        skill,
        oldLevel,
        newLevel: progression.level,
      });
    }
  }

  /**
   * Apply rewards to profile
   */
  private applyRewards(profile: UserProfile, rewards: CycleRewards): void {
    const oldLevel = profile.level;
    profile.experience += rewards.experience;
    profile.level = this.calculateLevel(profile.experience);

    profile.inventory.coins += rewards.coins;
    rewards.badges?.forEach(badge => profile.inventory.badges.add(badge));
    rewards.skins?.forEach(skin => profile.inventory.skins.add(skin));

    if (profile.level > oldLevel) {
      this.emit('levelUp', {
        playerId: profile.id,
        oldLevel,
        newLevel: profile.level,
      });
    }
  }

  /**
   * Update statistics based on game metrics
   */
  private updateStatistics(profile: UserProfile, metrics: PlayerMetrics): void {
    const stats = profile.statistics;
    
    stats.averageGameDuration = this.calculateNewAverage(
      stats.averageGameDuration,
      metrics.responseTime,
      profile.totalGamesPlayed
    );

    stats.winRate = ((stats.winRate * (profile.totalGamesPlayed - 1)) + 
      (metrics.strategicScore > 0.5 ? 1 : 0)) / profile.totalGamesPlayed;

    stats.successfulStrategies += metrics.strategicScore > 0.7 ? 1 : 0;
    
    if (metrics.strategicScore > (stats.personalBests.highestStrategicScore || 0)) {
      stats.personalBests.highestStrategicScore = metrics.strategicScore;
    }
  }

  /**
   * Initialize skill progression
   */
  private initializeSkillProgression(): Record<LeadershipSkill, SkillProgression> {
    const progression: Record<LeadershipSkill, SkillProgression> = {} as Record<LeadershipSkill, SkillProgression>;
    
    Object.values(LeadershipSkill).forEach(skill => {
      progression[skill] = {
        level: 1,
        experience: 0,
        nextLevelThreshold: this.calculateSkillThreshold(1)
      };
    });

    return progression;
  }

  /**
   * Generate level thresholds
   */
  private generateLevelThresholds(): number[] {
    const thresholds: number[] = [];
    let baseXP = 1000;
    const multiplier = 1.5;

    for (let i = 0; i < 100; i++) {
      thresholds.push(Math.floor(baseXP));
      baseXP *= multiplier;
    }

    return thresholds;
  }

  /**
   * Generate skill level thresholds
   */
  private generateSkillLevelThresholds(): number[] {
    const thresholds: number[] = [];
    let baseXP = 500;
    const multiplier = 1.3;

    for (let i = 0; i < 50; i++) {
      thresholds.push(Math.floor(baseXP));
      baseXP *= multiplier;
    }

    return thresholds;
  }

  /**
   * Calculate level based on experience
   */
  private calculateLevel(experience: number): number {
    let totalXP = 0;
    for (let i = 0; i < this.levelThresholds.length; i++) {
      if (experience < totalXP + this.levelThresholds[i]) {
        return i + 1;
      }
      totalXP += this.levelThresholds[i];
    }
    return this.levelThresholds.length + 1;
  }

  /**
   * Calculate skill threshold for given level
   */
  private calculateSkillThreshold(level: number): number {
    return this.skillLevelThresholds[level - 1] || 
      this.skillLevelThresholds[this.skillLevelThresholds.length - 1];
  }

  /**
   * Calculate new average value
   */
  private calculateNewAverage(oldAvg: number, newValue: number, count: number): number {
    return ((oldAvg * (count - 1)) + newValue) / count;
  }

  /**
   * Check and award achievements
   */
  private checkAchievements(profile: UserProfile): void {
    for (const [id, achievement] of this.achievements) {
      if (profile.achievements.has(id)) {
        continue;
      }

      let awarded = false;
      switch (achievement.requirement.type) {
        case 'games_played':
          awarded = profile.totalGamesPlayed >= achievement.requirement.value;
          break;
        case 'cycle_completions':
          awarded = profile.cyclesCompleted >= achievement.requirement.value;
          break;
        case 'skill_level':
          awarded = Object.values(profile.skillProgression)
            .some(skill => skill.level >= achievement.requirement.value);
          break;
      }

      if (awarded) {
        profile.achievements.add(id);
        profile.experience += achievement.reward.experience;
        if (achievement.reward.badge) {
          profile.inventory.badges.add(achievement.reward.badge);
        }
        if (achievement.reward.title) {
          profile.inventory.titles.add(achievement.reward.title);
        }

        this.emit('achievementUnlocked', {
          playerId: profile.id,
          achievementId: id,
          achievement
        });
      }
    }
  }

  /**
   * Get achievement progress
   */
  public getAchievementProgress(id: PlayerId): Map<string, number> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const progress = new Map<string, number>();
    
    for (const [achievementId, achievement] of this.achievements) {
      if (profile.achievements.has(achievementId)) {
        progress.set(achievementId, 1);
        continue;
      }

      let progressValue = 0;
      switch (achievement.requirement.type) {
        case 'games_played':
          progressValue = profile.totalGamesPlayed / achievement.requirement.value;
          break;
        case 'cycle_completions':
          progressValue = profile.cyclesCompleted / achievement.requirement.value;
          break;
        case 'skill_level':
          progressValue = Math.max(
            ...Object.values(profile.skillProgression)
              .map(skill => skill.level / achievement.requirement.value)
          );
          break;
      }
      progress.set(achievementId, Math.min(progressValue, 0.99));
    }

    return progress;
  }

  /**
   * Update user preferences
   */
  public updatePreferences(id: PlayerId, preferences: Partial<UserPreferences>): void {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.preferences = {
      ...profile.preferences,
      ...preferences
    };

    this.emit('preferencesUpdated', { id, preferences: profile.preferences });
  }
}