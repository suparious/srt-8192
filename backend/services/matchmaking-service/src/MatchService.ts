import { EventEmitter } from 'events';
import {
  PlayerId,
  GameSessionId,
  ServerPlayer,
  MatchmakingData,
  DifficultyLevel,
  PlayStyle
} from '../game-logic-service/types';

interface QueuedPlayer {
  player: ServerPlayer;
  queueTime: Date;
  preferredRegions: string[];
  rating: number;
}

interface MatchCriteria {
  minPlayers: number;
  maxPlayers: number;
  ratingTolerance: number;
  maxWaitTime: number; // milliseconds
  regionPriority: boolean;
}

export class MatchService extends EventEmitter {
  private playerQueue: Map<PlayerId, QueuedPlayer>;
  private activeMatches: Map<GameSessionId, Set<PlayerId>>;
  private matchCriteria: MatchCriteria;
  private matchmakingInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.playerQueue = new Map();
    this.activeMatches = new Map();
    this.matchCriteria = {
      minPlayers: 2,
      maxPlayers: 8,
      ratingTolerance: 200,
      maxWaitTime: 300000, // 5 minutes
      regionPriority: true
    };
    this.matchmakingInterval = null;
  }

  /**
   * Start the matchmaking service
   */
  public start(): void {
    if (!this.matchmakingInterval) {
      this.matchmakingInterval = setInterval(() => {
        this.processQueue();
      }, 5000); // Check queue every 5 seconds
    }
  }

  /**
   * Stop the matchmaking service
   */
  public stop(): void {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
  }

  /**
   * Add a player to the matchmaking queue
   */
  public queuePlayer(player: ServerPlayer): boolean {
    if (this.playerQueue.has(player.id) || this.isPlayerInMatch(player.id)) {
      return false;
    }

    const queuedPlayer: QueuedPlayer = {
      player,
      queueTime: new Date(),
      preferredRegions: player.matchmakingData.preferredRegions,
      rating: player.matchmakingData.rating
    };

    this.playerQueue.set(player.id, queuedPlayer);
    this.emit('playerQueued', player.id);
    return true;
  }

  /**
   * Remove a player from the matchmaking queue
   */
  public dequeuePlayer(playerId: PlayerId): boolean {
    const removed = this.playerQueue.delete(playerId);
    if (removed) {
      this.emit('playerDequeued', playerId);
    }
    return removed;
  }

  /**
   * Check if a player is in an active match
   */
  private isPlayerInMatch(playerId: PlayerId): boolean {
    for (const [_, players] of this.activeMatches) {
      if (players.has(playerId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Process the matchmaking queue
   */
  private processQueue(): void {
    if (this.playerQueue.size < this.matchCriteria.minPlayers) {
      return;
    }

    const now = new Date();
    const queuedPlayers = Array.from(this.playerQueue.values())
      .sort((a, b) => a.queueTime.getTime() - b.queueTime.getTime());

    for (const anchor of queuedPlayers) {
      if (!this.playerQueue.has(anchor.player.id)) {
        continue; // Player may have been matched in a previous iteration
      }

      const potentialMatch = this.findPotentialMatch(anchor, now);
      if (potentialMatch.length >= this.matchCriteria.minPlayers) {
        this.createMatch(potentialMatch);
      }
    }
  }

  /**
   * Find potential match candidates for a queued player
   */
  private findPotentialMatch(anchor: QueuedPlayer, now: Date): QueuedPlayer[] {
    const waitTime = now.getTime() - anchor.queueTime.getTime();
    const ratingRange = this.calculateRatingRange(waitTime);
    const potentialMatch: QueuedPlayer[] = [anchor];

    for (const candidate of this.playerQueue.values()) {
      if (candidate.player.id === anchor.player.id) {
        continue;
      }

      if (potentialMatch.length >= this.matchCriteria.maxPlayers) {
        break;
      }

      if (this.isPlayerCompatible(anchor, candidate, ratingRange)) {
        potentialMatch.push(candidate);
      }
    }

    return potentialMatch;
  }

  /**
   * Calculate acceptable rating range based on wait time
   */
  private calculateRatingRange(waitTime: number): number {
    const baseRange = this.matchCriteria.ratingTolerance;
    const waitTimeMultiplier = Math.min(waitTime / this.matchCriteria.maxWaitTime, 1);
    return baseRange + (baseRange * waitTimeMultiplier);
  }

  /**
   * Check if two players are compatible for matching
   */
  private isPlayerCompatible(
    anchor: QueuedPlayer,
    candidate: QueuedPlayer,
    ratingRange: number
  ): boolean {
    // Check rating compatibility
    const ratingDiff = Math.abs(anchor.rating - candidate.rating);
    if (ratingDiff > ratingRange) {
      return false;
    }

    // Check region compatibility if enabled
    if (this.matchCriteria.regionPriority) {
      const hasCommonRegion = anchor.preferredRegions.some(region =>
        candidate.preferredRegions.includes(region)
      );
      if (!hasCommonRegion) {
        return false;
      }
    }

    // Check playstyle compatibility
    const anchorStyles = new Set(anchor.player.matchmakingData.playStyle);
    const candidateStyles = new Set(candidate.player.matchmakingData.playStyle);
    const hasComplementaryStyles = this.hasComplementaryPlayStyles(anchorStyles, candidateStyles);
    
    return hasComplementaryStyles;
  }

  /**
   * Check if players have complementary play styles
   */
  private hasComplementaryPlayStyles(
    styles1: Set<PlayStyle>,
    styles2: Set<PlayStyle>
  ): boolean {
    // Players with similar styles can be matched
    const intersection = new Set(
      Array.from(styles1).filter(style => styles2.has(style))
    );
    if (intersection.size > 0) {
      return true;
    }

    // Check for complementary styles
    const hasAggressive = styles1.has(PlayStyle.AGGRESSIVE) || styles2.has(PlayStyle.AGGRESSIVE);
    const hasDefensive = styles1.has(PlayStyle.DEFENSIVE) || styles2.has(PlayStyle.DEFENSIVE);
    const hasDiplomatic = styles1.has(PlayStyle.DIPLOMATIC) || styles2.has(PlayStyle.DIPLOMATIC);
    const hasEconomic = styles1.has(PlayStyle.ECONOMIC) || styles2.has(PlayStyle.ECONOMIC);

    // At least two different play styles should be present
    const uniqueStyles = new Set([...Array.from(styles1), ...Array.from(styles2)]);
    return uniqueStyles.size >= 2;
  }

  /**
   * Create a match with the selected players
   */
  private createMatch(players: QueuedPlayer[]): void {
    const sessionId = crypto.randomUUID() as GameSessionId;
    const matchedPlayers = new Set<PlayerId>();

    // Remove players from queue and add to match
    for (const { player } of players) {
      this.playerQueue.delete(player.id);
      matchedPlayers.add(player.id);
    }

    this.activeMatches.set(sessionId, matchedPlayers);

    // Emit match created event
    this.emit('matchCreated', {
      sessionId,
      players: players.map(p => p.player)
    });
  }

  /**
   * Update matchmaking criteria
   */
  public updateMatchCriteria(criteria: Partial<MatchCriteria>): void {
    this.matchCriteria = {
      ...this.matchCriteria,
      ...criteria
    };
  }

  /**
   * Get current queue statistics
   */
  public getQueueStats() {
    return {
      queueSize: this.playerQueue.size,
      activeMatches: this.activeMatches.size,
      averageWaitTime: this.calculateAverageWaitTime(),
      regionDistribution: this.calculateRegionDistribution()
    };
  }

  /**
   * Calculate average wait time for queued players
   */
  private calculateAverageWaitTime(): number {
    if (this.playerQueue.size === 0) {
      return 0;
    }

    const now = new Date().getTime();
    const totalWaitTime = Array.from(this.playerQueue.values())
      .reduce((sum, { queueTime }) => sum + (now - queueTime.getTime()), 0);

    return totalWaitTime / this.playerQueue.size;
  }

  /**
   * Calculate distribution of preferred regions in queue
   */
  private calculateRegionDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();

    for (const { preferredRegions } of this.playerQueue.values()) {
      for (const region of preferredRegions) {
        distribution.set(region, (distribution.get(region) || 0) + 1);
      }
    }

    return distribution;
  }

  /**
   * Clean up completed matches
   */
  public cleanupMatches(completedSessionIds: GameSessionId[]): void {
    for (const sessionId of completedSessionIds) {
      this.activeMatches.delete(sessionId);
    }
  }
}