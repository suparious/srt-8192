import { GameState, PlayerId, Resources } from '../../../../shared/types';

export interface VictoryThresholds {
  economicDominance: number;    // Percentage of total resources (0.6 = 60%)
  territorialControl: number;   // Percentage of regions (0.7 = 70%)
  allianceStrength: number;     // Combined power threshold (e.g., 1000)
  diplomaticScore: number;      // Required diplomatic influence (e.g., 500)
  technologicalSupremacy: number; // Required tech level (e.g., 8)
}

export interface AllianceVictoryCondition {
  alliedPlayers: PlayerId[];
  combinedResources: Resources;
  combinedTerritories: number;
  diplomaticScore: number;
}

/**
 * Defines victory conditions for the 8192 game cycles.
 */
export class VictoryConditionChecker {
  private gameState: GameState;
  private thresholds: VictoryThresholds = {
    economicDominance: 0.6,
    territorialControl: 0.7,
    allianceStrength: 1000,
    diplomaticScore: 500,
    technologicalSupremacy: 8
  };

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Checks if any player meets the victory conditions.
   * @returns The PlayerId of the winner, or null if no winner yet.
   */
  public checkVictory(): PlayerId | PlayerId[] | null {
    // Check individual victories
    for (const player of this.gameState.players) {
      if (this.hasAchievedSoloVictory(player.id)) {
        return player.id;
      }
    }

    // Check alliance victories
    const alliances = this.gameState.diplomacy.getAlliances();
    for (const alliance of alliances) {
      if (this.hasAchievedAllianceVictory(alliance)) {
        return alliance;
      }
    }

    return null;
  }

  private hasAchievedSoloVictory(playerId: PlayerId): boolean {
    return (
      this.hasAchievedEconomicDominance(playerId) ||
      this.hasAchievedMilitaryVictory(playerId) ||
      this.hasAchievedTechnologicalSupremacy(playerId)
    );
  }

  private hasAchievedAllianceVictory(alliance: PlayerId[]): boolean {
    const combinedEconomic = this.calculateAllianceResources(alliance);
    const combinedTerritorial = this.calculateAllianceTerritories(alliance);
    const diplomaticStrength = this.calculateDiplomaticStrength(alliance);

    const totalResources = this.calculateTotalResources();
    const totalTerritories = this.gameState.regions.length;

    return (
      (combinedEconomic / totalResources >= this.thresholds.economicDominance * 0.8) && // 80% of solo requirement
      (combinedTerritorial / totalTerritories >= this.thresholds.territorialControl * 0.8) &&
      (diplomaticStrength >= this.thresholds.diplomaticScore)
    );
  }

  private hasAchievedTechnologicalSupremacy(playerId: PlayerId): boolean {
    const player = this.gameState.players.get(playerId);
    if (!player) return false;

    return player.techLevel >= this.thresholds.technologicalSupremacy;
  }

  private calculateAllianceResources(alliance: PlayerId[]): number {
    return alliance.reduce((total, playerId) => 
      total + this.calculatePlayerResources(playerId), 0);
  }

  private calculateAllianceTerritories(alliance: PlayerId[]): number {
    return alliance.reduce((total, playerId) => 
      total + this.gameState.regions.filter(r => r.controller === playerId).length, 0);
  }

  private calculateDiplomaticStrength(alliance: PlayerId[]): number {
    return this.gameState.diplomacy.calculateAllianceStrength(alliance);
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
