export interface GameSettings {
    /**
     * Maximum number of turns per game cycle.
     */
    maxTurnsPerCycle: number;
  
    /**
     * Resource control percentage needed for economic victory (0-1 scale).
     */
    economicVictoryThreshold: number;
  
    /**
     * Region control percentage needed for military victory (0-1 scale).
     */
    militaryVictoryThreshold: number;
  
    /**
     * Maximum allowed game cycles before reset.
     */
    maxGameCycles: number;
  
    /**
     * Base aggression level for AI opponents (0-1 scale).
     */
    aiBaseAggression: number;
  
    /**
     * Resource gain multiplier per turn.
     */
    resourceGainMultiplier: number;
  
    /**
     * Initial player resources at game start.
     */
    initialPlayerResources: number;
  }
  
  /**
   * Default game settings for 8192 game.
   */
  export const defaultGameSettings: GameSettings = {
    maxTurnsPerCycle: 100,
    economicVictoryThreshold: 0.6,
    militaryVictoryThreshold: 0.7,
    maxGameCycles: 8192,
    aiBaseAggression: 0.5,
    resourceGainMultiplier: 1.0,
    initialPlayerResources: 500,
  };
  