import { GameState, PlayerId, VictoryCondition } from './types';

/**
 * Defines victory conditions for the 8192 game cycles.
 */
export class VictoryConditionChecker {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Checks if any player meets the victory conditions.
   * @returns The PlayerId of the winner, or null if no winner yet.
   */
  public checkVictory(): PlayerId | null {
    for (const player of this.gameState.players) {
      if (this.hasAchievedEconomicDominance(player.id) || this.hasAchievedMilitaryVictory(player.id)) {
        return player.id;
      }
    }
    return null;
  }

  /**
   * Checks if the given player has achieved economic dominance.
   * @param playerId - The id of the player to check.
   * @returns True if the player has achieved economic victory.
   */
  private hasAchievedEconomicDominance(playerId: PlayerId): boolean {
    const player = this.gameState.players.get(playerId);
    if (!player) return false;

    // Example condition: Control of 60% of the resources in the game
    const totalResources = this.calculateTotalResources();
    const playerResources = this.calculatePlayerResources(playerId);
    return playerResources / totalResources >= 0.6;
  }

  /**
   * Checks if the given player has achieved a military victory.
   * @param playerId - The id of the player to check.
   * @returns True if the player has achieved military victory.
   */
  private hasAchievedMilitaryVictory(playerId: PlayerId): boolean {
    const playerControlledRegions = this.gameState.regions.filter(region => region.controller === playerId);

    // Example condition: Control 70% of the game regions
    return playerControlledRegions.length / this.gameState.regions.length >= 0.7;
  }

  /**
   * Calculates the total amount of resources in the game.
   * @returns Total resources available.
   */
  private calculateTotalResources(): number {
    return this.gameState.regions.reduce((total, region) => total + region.resources.value, 0);
  }

  /**
   * Calculates the total resources controlled by a specific player.
   * @param playerId - The id of the player.
   * @returns Total resources controlled by the player.
   */
  private calculatePlayerResources(playerId: PlayerId): number {
    return this.gameState.regions
      .filter(region => region.controller === playerId)
      .reduce((total, region) => total + region.resources.value, 0);
  }
}
