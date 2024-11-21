export interface Achievement {
    achievementId: string;
    name: string;
    description: string;
    points: number;
    isUnlocked: boolean;
  }
  
  export class AchievementSystem {
    private playerAchievements: Map<string, Achievement[]>;
  
    constructor() {
      this.playerAchievements = new Map();
    }
  
    /**
     * Initialize achievements for a new player
     * @param playerId - Unique identifier for the player
     */
    public initializeAchievements(playerId: string): void {
      if (!this.playerAchievements.has(playerId)) {
        this.playerAchievements.set(playerId, this.getDefaultAchievements());
      }
    }
  
    /**
     * Unlock an achievement for a player
     * @param playerId - Unique identifier for the player
     * @param achievementId - Unique identifier for the achievement
     */
    public unlockAchievement(playerId: string, achievementId: string): void {
      const achievements = this.playerAchievements.get(playerId);
      if (achievements) {
        const achievement = achievements.find(a => a.achievementId === achievementId);
        if (achievement && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
        }
      }
    }
  
    /**
     * Get the list of achievements for a player
     * @param playerId - Unique identifier for the player
     * @returns Array of Achievement or undefined if player does not exist
     */
    public getPlayerAchievements(playerId: string): Achievement[] | undefined {
      return this.playerAchievements.get(playerId);
    }
  
    /**
     * Get default achievements for new players
     * @returns Array of Achievement representing default achievements
     */
    private getDefaultAchievements(): Achievement[] {
      return [
        { achievementId: '1', name: 'First Steps', description: 'Complete the tutorial.', points: 10, isUnlocked: false },
        { achievementId: '2', name: 'Resource Collector', description: 'Collect 100 units of resources.', points: 20, isUnlocked: false },
        { achievementId: '3', name: 'Combat Initiate', description: 'Win your first combat.', points: 30, isUnlocked: false },
        { achievementId: '4', name: 'Builder', description: 'Construct your first building.', points: 25, isUnlocked: false }
      ];
    }
  
    /**
     * Get the total achievement points for a player
     * @param playerId - Unique identifier for the player
     * @returns Total achievement points or 0 if player does not exist
     */
    public getTotalAchievementPoints(playerId: string): number {
      const achievements = this.playerAchievements.get(playerId);
      if (achievements) {
        return achievements.reduce((total, achievement) => total + (achievement.isUnlocked ? achievement.points : 0), 0);
      }
      return 0;
    }
  }
  
  // Example usage
  const achievementSystem = new AchievementSystem();
  achievementSystem.initializeAchievements('player1');
  achievementSystem.unlockAchievement('player1', '1');
  console.log(achievementSystem.getPlayerAchievements('player1'));
  console.log(achievementSystem.getTotalAchievementPoints('player1'));
  