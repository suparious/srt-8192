import { EventEmitter } from 'events';
import {
  PlayerId,
  SessionId,
  GameConfig,
  PlayerState,
  Resources
} from '../game-logic-service/types';

interface QueuedPlayer {
  id: PlayerId;
  rating: number;
  region: string;
  preferences: MatchPreferences;
  joinTime: number;
  readyState: boolean;
  lastPing: number;
}

interface MatchPreferences {
  gameMode: 'standard' | 'ranked' | 'custom';
  maxWaitTime: number;
  ratingRange: number;
  preferredRegions: string[];
  minPlayers: number;
  maxPlayers: number;
}

interface MatchGroup {
  players: QueuedPlayer[];
  averageRating: number;
  readyCheck: Map<PlayerId, boolean>;
  regionPreference: string;
  sessionId?: SessionId;
  formationTime: number;
}

interface QueueMetrics {
  totalPlayers: number;
  averageWaitTime: number;
  matchesFormed: number;
  failedMatches: number;
  regionalDistribution: Map<string, number>;
  ratingDistribution: number[];
}

export class MatchmakingQueue extends EventEmitter {
  private queue: Map<PlayerId, QueuedPlayer>;
  private activeMatches: Map<SessionId, MatchGroup>;
  private metrics: QueueMetrics;
  
  private readonly MATCH_CHECK_INTERVAL = 1000; // 1 second
  private readonly READY_CHECK_TIMEOUT = 30000; // 30 seconds
  private readonly PING_TIMEOUT = 45000; // 45 seconds
  private readonly MAX_RATING_DEVIATION = 200;
  private readonly MIN_PLAYERS_FOR_MATCH = 2;
  
  private matchCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.queue = new Map();
    this.activeMatches = new Map();
    this.metrics = this.initializeMetrics();
    this.startMatchmaking();
  }

  /**
   * Start the matchmaking process
   */
  private startMatchmaking(): void {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
    }

    this.matchCheckInterval = setInterval(() => {
      this.processQueue();
    }, this.MATCH_CHECK_INTERVAL);
  }

  /**
   * Add a player to the matchmaking queue
   */
  public enqueuePlayer(
    playerId: PlayerId,
    rating: number,
    preferences: MatchPreferences
  ): boolean {
    if (this.queue.has(playerId)) {
      return false;
    }

    const queuedPlayer: QueuedPlayer = {
      id: playerId,
      rating,
      region: preferences.preferredRegions[0],
      preferences,
      joinTime: Date.now(),
      readyState: false,
      lastPing: Date.now()
    };

    this.queue.set(playerId, queuedPlayer);
    this.updateMetrics();
    this.emit('playerJoined', playerId);

    return true;
  }

  /**
   * Remove a player from the queue
   */
  public dequeuePlayer(playerId: PlayerId): boolean {
    const removed = this.queue.delete(playerId);
    if (removed) {
      this.updateMetrics();
      this.emit('playerLeft', playerId);
    }
    return removed;
  }

  /**
   * Update player's ready state during match formation
   */
  public updatePlayerReadyState(
    playerId: PlayerId,
    sessionId: SessionId,
    ready: boolean
  ): void {
    const match = this.activeMatches.get(sessionId);
    if (!match) return;

    match.readyCheck.set(playerId, ready);
    
    // Check if all players are ready
    const allReady = Array.from(match.readyCheck.values()).every(state => state);
    if (allReady) {
      this.finalizeMatch(sessionId);
    }
  }

  /**
   * Update player's last ping time
   */
  public updatePlayerPing(playerId: PlayerId): void {
    const player = this.queue.get(playerId);
    if (player) {
      player.lastPing = Date.now();
    }
  }

  /**
   * Process the matchmaking queue
   */
  private processQueue(): void {
    // Remove inactive players
    this.removeInactivePlayers();

    // Get eligible players
    const eligiblePlayers = Array.from(this.queue.values())
      .filter(player => !this.isPlayerInMatch(player.id));

    if (eligiblePlayers.length < this.MIN_PLAYERS_FOR_MATCH) {
      return;
    }

    // Sort by wait time and rating
    eligiblePlayers.sort((a, b) => {
      const waitDiff = (Date.now() - b.joinTime) - (Date.now() - a.joinTime);
      if (Math.abs(waitDiff) > 30000) { // Prioritize wait time after 30 seconds
        return waitDiff;
      }
      return Math.abs(a.rating - b.rating); // Otherwise prioritize rating similarity
    });

    // Try to form matches
    for (const anchor of eligiblePlayers) {
      if (this.isPlayerInMatch(anchor.id)) continue;

      const potentialMatch = this.findPotentialMatch(anchor, eligiblePlayers);
      if (potentialMatch.players.length >= anchor.preferences.minPlayers) {
        this.createMatch(potentialMatch);
      }
    }
  }

  /**
   * Find potential match for a player
   */
  private findPotentialMatch(
    anchor: QueuedPlayer,
    candidates: QueuedPlayer[]
  ): MatchGroup {
    const match: MatchGroup = {
      players: [anchor],
      averageRating: anchor.rating,
      readyCheck: new Map([[anchor.id, false]]),
      regionPreference: anchor.region,
      formationTime: Date.now()
    };

    const maxPlayers = anchor.preferences.maxPlayers;
    const waitTime = Date.now() - anchor.joinTime;
    let ratingRange = this.MAX_RATING_DEVIATION;

    // Expand rating range based on wait time
    if (waitTime > 30000) { // After 30 seconds
      ratingRange *= 1.5;
    }
    if (waitTime > 60000) { // After 60 seconds
      ratingRange *= 2;
    }

    for (const candidate of candidates) {
      if (match.players.length >= maxPlayers) break;
      if (candidate.id === anchor.id) continue;
      if (this.isPlayerInMatch(candidate.id)) continue;

      if (this.arePlayersCompatible(match, candidate, ratingRange)) {
        match.players.push(candidate);
        match.readyCheck.set(candidate.id, false);
        match.averageRating = this.calculateAverageRating(match.players);
      }
    }

    return match;
  }

  /**
   * Check if a player is compatible with a match group
   */
  private arePlayersCompatible(
    match: MatchGroup,
    candidate: QueuedPlayer,
    ratingRange: number
  ): boolean {
    // Check rating compatibility
    const ratingDiff = Math.abs(match.averageRating - candidate.rating);
    if (ratingDiff > ratingRange) {
      return false;
    }

    // Check region compatibility
    const hasCompatibleRegion = candidate.preferences.preferredRegions
      .includes(match.regionPreference);
    if (!hasCompatibleRegion) {
      return false;
    }

    // Check game mode compatibility
    const anchor = match.players[0];
    if (candidate.preferences.gameMode !== anchor.preferences.gameMode) {
      return false;
    }

    return true;
  }

  /**
   * Create a new match from a group of players
   */
  private createMatch(group: MatchGroup): void {
    const sessionId = crypto.randomUUID() as SessionId;
    group.sessionId = sessionId;

    // Remove players from queue
    group.players.forEach(player => {
      this.queue.delete(player.id);
    });

    // Add to active matches
    this.activeMatches.set(sessionId, group);

    // Start ready check
    this.startReadyCheck(sessionId);

    this.emit('matchCreated', {
      sessionId,
      players: group.players.map(p => p.id),
      averageRating: group.averageRating,
      region: group.regionPreference
    });
  }

  /**
   * Start the ready check process for a match
   */
  private startReadyCheck(sessionId: SessionId): void {
    setTimeout(() => {
      const match = this.activeMatches.get(sessionId);
      if (!match) return;

      // Check if all players are ready
      const notReady = Array.from(match.readyCheck.entries())
        .filter(([_, ready]) => !ready)
        .map(([playerId]) => playerId);

      if (notReady.length > 0) {
        this.cancelMatch(sessionId, 'ready_check_failed', notReady);
      }
    }, this.READY_CHECK_TIMEOUT);
  }

  /**
   * Finalize a match after ready check
   */
  private finalizeMatch(sessionId: SessionId): void {
    const match = this.activeMatches.get(sessionId);
    if (!match) return;

    this.activeMatches.delete(sessionId);
    this.metrics.matchesFormed++;

    this.emit('matchFinalized', {
      sessionId,
      players: match.players.map(p => p.id),
      region: match.regionPreference,
      formation: {
        timeToMatch: Date.now() - match.players[0].joinTime,
        ratingSpread: this.calculateRatingSpread(match.players)
      }
    });
  }

  /**
   * Cancel a match and handle cleanup
   */
  private cancelMatch(
    sessionId: SessionId,
    reason: string,
    affectedPlayers: PlayerId[]
  ): void {
    const match = this.activeMatches.get(sessionId);
    if (!match) return;

    this.activeMatches.delete(sessionId);
    this.metrics.failedMatches++;

    // Re-queue players who were ready
    match.players
      .filter(player => !affectedPlayers.includes(player.id))
      .forEach(player => {
        this.enqueuePlayer(player.id, player.rating, player.preferences);
      });

    this.emit('matchCancelled', {
      sessionId,
      reason,
      affectedPlayers
    });
  }

  /**
   * Remove inactive players from queue
   */
  private removeInactivePlayers(): void {
    const now = Date.now();
    for (const [playerId, player] of this.queue.entries()) {
      if (now - player.lastPing > this.PING_TIMEOUT) {
        this.dequeuePlayer(playerId);
      }
    }
  }

  /**
   * Calculate average rating for a group of players
   */
  private calculateAverageRating(players: QueuedPlayer[]): number {
    const sum = players.reduce((acc, player) => acc + player.rating, 0);
    return Math.round(sum / players.length);
  }

  /**
   * Calculate rating spread for a group of players
   */
  private calculateRatingSpread(players: QueuedPlayer[]): number {
    const ratings = players.map(p => p.rating);
    return Math.max(...ratings) - Math.min(...ratings);
  }

  /**
   * Check if a player is in any active match
   */
  private isPlayerInMatch(playerId: PlayerId): boolean {
    for (const match of this.activeMatches.values()) {
      if (match.players.some(p => p.id === playerId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Initialize metrics tracking
   */
  private initializeMetrics(): QueueMetrics {
    return {
      totalPlayers: 0,
      averageWaitTime: 0,
      matchesFormed: 0,
      failedMatches: 0,
      regionalDistribution: new Map(),
      ratingDistribution: []
    };
  }

  /**
   * Update queue metrics
   */
  private updateMetrics(): void {
    this.metrics.totalPlayers = this.queue.size;
    
    // Calculate average wait time
    const totalWaitTime = Array.from(this.queue.values())
      .reduce((sum, player) => sum + (Date.now() - player.joinTime), 0);
    this.metrics.averageWaitTime = this.queue.size > 0 ? 
      totalWaitTime / this.queue.size : 0;

    // Update regional distribution
    this.metrics.regionalDistribution.clear();
    for (const player of this.queue.values()) {
      const count = this.metrics.regionalDistribution.get(player.region) || 0;
      this.metrics.regionalDistribution.set(player.region, count + 1);
    }

    // Update rating distribution
    const ratings = Array.from(this.queue.values()).map(p => p.rating);
    this.metrics.ratingDistribution = ratings;

    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Get current queue metrics
   */
  public getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  /**
   * Stop matchmaking process
   */
  public stop(): void {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
    }
  }
}