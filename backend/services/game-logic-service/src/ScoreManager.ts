export interface PlayerScore {
    playerId: string;
    totalScore: number;
    turnsTaken: number;
    resourcePoints: number;
    combatPoints: number;
    achievementPoints: number;
  }
  
  export class ScoreManager {
    private playerScores: Map<string, PlayerScore>;
  
    constructor() {
      this.playerScores = new Map();
    }
  
    /**
     * Initialize score for a new player
     * @param playerId - Unique identifier for the player
     */
    public initializePlayerScore(playerId: string): void {
      if (!this.playerScores.has(playerId)) {
        this.playerScores.set(playerId, {
          playerId,
          totalScore: 0,
          turnsTaken: 0,
          resourcePoints: 0,
          combatPoints: 0,
          achievementPoints: 0,
        });
      }
    }
  
    /**
     * Update score based on resource collection
     * @param playerId - Unique identifier for the player
     * @param points - Points gained from resource collection
     */
    public updateResourcePoints(playerId: string, points: number): void {
      const playerScore = this.playerScores.get(playerId);
      if (playerScore) {
        playerScore.resourcePoints += points;
        playerScore.totalScore += points;
      }
    }
  
    /**
     * Update score based on combat results
     * @param playerId - Unique identifier for the player
     * @param points - Points gained from combat
     */
    public updateCombatPoints(playerId: string, points: number): void {
      const playerScore = this.playerScores.get(playerId);
      if (playerScore) {
        playerScore.combatPoints += points;
        playerScore.totalScore += points;
      }
    }
  
    /**
     * Update score based on achievements
     * @param playerId - Unique identifier for the player
     * @param points - Points gained from achievements
     */
    public updateAchievementPoints(playerId: string, points: number): void {
      const playerScore = this.playerScores.get(playerId);
      if (playerScore) {
        playerScore.achievementPoints += points;
        playerScore.totalScore += points;
      }
    }
  
    /**
     * Increment the turn counter for a player
     * @param playerId - Unique identifier for the player
     */
    public incrementTurnsTaken(playerId: string): void {
      const playerScore = this.playerScores.get(playerId);
      if (playerScore) {
        playerScore.turnsTaken += 1;
      }
    }
  
    /**
     * Get the current score of a player
     * @param playerId - Unique identifier for the player
     * @returns PlayerScore or undefined if player does not exist
     */
    public getPlayerScore(playerId: string): PlayerScore | undefined {
      return this.playerScores.get(playerId);
    }
  
    /**
     * Get leaderboard sorted by total score
     * @returns Array of PlayerScore sorted in descending order of totalScore
     */
    public getLeaderboard(): PlayerScore[] {
      return Array.from(this.playerScores.values()).sort((a, b) => b.totalScore - a.totalScore);
    }
  }
  
  // Example usage
  const scoreManager = new ScoreManager();
  scoreManager.initializePlayerScore('player1');
  scoreManager.updateResourcePoints('player1', 100);
  scoreManager.updateCombatPoints('player1', 50);
  scoreManager.incrementTurnsTaken('player1');
  console.log(scoreManager.getPlayerScore('player1'));
  console.log(scoreManager.getLeaderboard());
  