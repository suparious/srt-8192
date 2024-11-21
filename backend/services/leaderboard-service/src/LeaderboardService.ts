import fs from 'fs';
import path from 'path';

interface PlayerStats {
  id: string;
  score: number;
  achievements: string[];
}

class LeaderboardService {
  private leaderboardFilePath: string;
  private leaderboard: PlayerStats[];
  private maxLeaderboardSize: number;

  constructor(leaderboardFileName: string = 'leaderboard.json', maxLeaderboardSize: number = 100) {
    this.leaderboardFilePath = path.join(__dirname, leaderboardFileName);
    this.leaderboard = this.loadLeaderboard();
    this.maxLeaderboardSize = maxLeaderboardSize;
  }

  /**
   * Load the leaderboard from a file.
   */
  private loadLeaderboard(): PlayerStats[] {
    try {
      const data = fs.readFileSync(this.leaderboardFilePath, 'utf-8');
      return JSON.parse(data) as PlayerStats[];
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      return [];
    }
  }

  /**
   * Save the current leaderboard to a file.
   */
  private saveLeaderboard(): void {
    try {
      const data = JSON.stringify(this.leaderboard, null, 2);
      fs.writeFileSync(this.leaderboardFilePath, data, 'utf-8');
    } catch (err) {
      console.error('Error saving leaderboard:', err);
    }
  }

  /**
   * Add or update a player's stats in the leaderboard.
   */
  public updatePlayerStats(playerStats: PlayerStats): void {
    const existingPlayerIndex = this.leaderboard.findIndex(player => player.id === playerStats.id);
    if (existingPlayerIndex >= 0) {
      this.leaderboard[existingPlayerIndex] = playerStats;
    } else {
      this.leaderboard.push(playerStats);
    }
    this.leaderboard.sort((a, b) => b.score - a.score); // Sort by score descending

    // Trim the leaderboard if it exceeds the maximum size
    if (this.leaderboard.length > this.maxLeaderboardSize) {
      this.leaderboard = this.leaderboard.slice(0, this.maxLeaderboardSize);
    }

    this.saveLeaderboard();
  }

  /**
   * Get the current leaderboard.
   */
  public getLeaderboard(): PlayerStats[] {
    return this.leaderboard;
  }

  /**
   * Remove a player from the leaderboard.
   */
  public removePlayer(playerId: string): void {
    this.leaderboard = this.leaderboard.filter(player => player.id !== playerId);
    this.saveLeaderboard();
  }

  /**
   * Get the top N players from the leaderboard.
   */
  public getTopPlayers(n: number): PlayerStats[] {
    return this.leaderboard.slice(0, n);
  }

  /**
   * Reset the leaderboard.
   */
  public resetLeaderboard(): void {
    this.leaderboard = [];
    this.saveLeaderboard();
    console.log('Leaderboard has been reset.');
  }
}

// Example usage
const leaderboardService = new LeaderboardService();
leaderboardService.updatePlayerStats({ id: 'player1', score: 1500, achievements: ['First Win'] });
leaderboardService.updatePlayerStats({ id: 'player2', score: 2000, achievements: ['Master Strategist'] });
console.log('Top Players:', leaderboardService.getTopPlayers(2));

export { LeaderboardService, PlayerStats };
