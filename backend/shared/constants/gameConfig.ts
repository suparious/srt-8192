/**
 * Core game configuration constants for 8192
 */

/**
 * Game cycle configuration
 */
export const CYCLE_CONFIG = {
    TOTAL_CYCLES: 8192,
    PHASES: {
      PREPARATION: {
        DURATION: 300, // 5 minutes in seconds
        MAX_ACTIONS: 5,
        RESOURCE_MULTIPLIER: 1.5,
        AI_AGGRESSION_MULTIPLIER: 0.5
      },
      ACTION: {
        DURATION: 600, // 10 minutes in seconds
        MAX_ACTIONS: 10,
        RESOURCE_MULTIPLIER: 1.0,
        AI_AGGRESSION_MULTIPLIER: 1.0
      },
      RESOLUTION: {
        DURATION: 300, // 5 minutes in seconds
        MAX_ACTIONS: 3,
        RESOURCE_MULTIPLIER: 0.5,
        AI_AGGRESSION_MULTIPLIER: 1.5
      },
      INTERMISSION: {
        DURATION: 120, // 2 minutes in seconds
        MAX_ACTIONS: 0,
        RESOURCE_MULTIPLIER: 0.0,
        AI_AGGRESSION_MULTIPLIER: 0.0
      }
    }
  } as const;
  
  /**
   * Resource configuration
   */
  export const RESOURCE_CONFIG = {
    BASE_PRODUCTION: {
      ENERGY: 100,
      MATERIALS: 80,
      TECHNOLOGY: 40,
      INTELLIGENCE: 20,
      MORALE: 50
    },
    STORAGE_LIMITS: {
      ENERGY: 10000,
      MATERIALS: 10000,
      TECHNOLOGY: 5000,
      INTELLIGENCE: 2000,
      MORALE: 1000
    },
    DECAY_RATES: {
      ENERGY: 0.1,    // 10% per cycle
      MATERIALS: 0.05, // 5% per cycle
      TECHNOLOGY: 0.02, // 2% per cycle
      INTELLIGENCE: 0.15, // 15% per cycle
      MORALE: 0.2     // 20% per cycle
    },
    TRADE_FEES: {
      ENERGY: 0.05,    // 5% transaction fee
      MATERIALS: 0.05,
      TECHNOLOGY: 0.1,
      INTELLIGENCE: 0.1,
      MORALE: 0.05
    }
  } as const;
  
  /**
   * Unit configuration
   */
  export const UNIT_CONFIG = {
    TYPES: {
      INFANTRY: {
        BASE_COST: {
          ENERGY: 50,
          MATERIALS: 100,
          MORALE: 10
        },
        STATS: {
          HEALTH: 100,
          ATTACK: 10,
          DEFENSE: 8,
          MOVEMENT: 2
        },
        MAX_PER_REGION: 10
      },
      MECHANIZED: {
        BASE_COST: {
          ENERGY: 150,
          MATERIALS: 200,
          TECHNOLOGY: 50
        },
        STATS: {
          HEALTH: 200,
          ATTACK: 20,
          DEFENSE: 15,
          MOVEMENT: 3
        },
        MAX_PER_REGION: 5
      },
      AERIAL: {
        BASE_COST: {
          ENERGY: 200,
          MATERIALS: 150,
          TECHNOLOGY: 100
        },
        STATS: {
          HEALTH: 150,
          ATTACK: 25,
          DEFENSE: 10,
          MOVEMENT: 5
        },
        MAX_PER_REGION: 3
      },
      NAVAL: {
        BASE_COST: {
          ENERGY: 250,
          MATERIALS: 300,
          TECHNOLOGY: 150
        },
        STATS: {
          HEALTH: 300,
          ATTACK: 30,
          DEFENSE: 25,
          MOVEMENT: 4
        },
        MAX_PER_REGION: 2
      },
      SPECIAL: {
        BASE_COST: {
          ENERGY: 300,
          MATERIALS: 200,
          TECHNOLOGY: 200,
          INTELLIGENCE: 100
        },
        STATS: {
          HEALTH: 200,
          ATTACK: 40,
          DEFENSE: 20,
          MOVEMENT: 3
        },
        MAX_PER_REGION: 1
      }
    },
    EXPERIENCE_CONFIG: {
      BASE_GAIN: 10,
      LEVEL_MULTIPLIER: 1.5,
      MAX_LEVEL: 10,
      STATS_PER_LEVEL: {
        ATTACK: 1.1,  // 10% increase per level
        DEFENSE: 1.1,
        MOVEMENT: 1.05 // 5% increase per level
      }
    }
  } as const;
  
  /**
   * Combat configuration
   */
  export const COMBAT_CONFIG = {
    BASE_HIT_CHANCE: 0.7,
    CRITICAL_HIT_CHANCE: 0.1,
    CRITICAL_HIT_MULTIPLIER: 1.5,
    TERRAIN_MODIFIERS: {
      PLAINS: {
        ATTACK: 1.0,
        DEFENSE: 1.0,
        MOVEMENT: 1.0
      },
      MOUNTAINS: {
        ATTACK: 0.8,
        DEFENSE: 1.3,
        MOVEMENT: 0.7
      },
      FOREST: {
        ATTACK: 0.9,
        DEFENSE: 1.2,
        MOVEMENT: 0.8
      },
      URBAN: {
        ATTACK: 0.7,
        DEFENSE: 1.4,
        MOVEMENT: 0.9
      },
      WATER: {
        ATTACK: 1.0,
        DEFENSE: 0.8,
        MOVEMENT: 1.2
      }
    },
    WEATHER_MODIFIERS: {
      CLEAR: {
        ATTACK: 1.0,
        DEFENSE: 1.0,
        MOVEMENT: 1.0
      },
      STORMY: {
        ATTACK: 0.8,
        DEFENSE: 0.9,
        MOVEMENT: 0.7
      },
      EXTREME_HEAT: {
        ATTACK: 0.9,
        DEFENSE: 0.9,
        MOVEMENT: 0.8
      },
      EXTREME_COLD: {
        ATTACK: 0.8,
        DEFENSE: 0.8,
        MOVEMENT: 0.6
      },
      ELECTROMAGNETIC_STORM: {
        ATTACK: 0.7,
        DEFENSE: 0.7,
        MOVEMENT: 0.5
      }
    }
  } as const;
  
  /**
   * Region configuration
   */
  export const REGION_CONFIG = {
    MAX_STRUCTURES: 5,
    CONTROL_THRESHOLD: 0.7, // 70% of region must be controlled to claim
    CONTESTATION_THRESHOLD: 0.3, // 30% presence to contest
    BASE_RESOURCE_GENERATION: {
      PLAINS: {
        ENERGY: 1.0,
        MATERIALS: 1.0,
        TECHNOLOGY: 1.0,
        INTELLIGENCE: 1.0,
        MORALE: 1.0
      },
      MOUNTAINS: {
        ENERGY: 1.2,
        MATERIALS: 1.5,
        TECHNOLOGY: 0.8,
        INTELLIGENCE: 0.8,
        MORALE: 0.9
      },
      FOREST: {
        ENERGY: 0.8,
        MATERIALS: 1.3,
        TECHNOLOGY: 0.9,
        INTELLIGENCE: 1.1,
        MORALE: 1.2
      },
      URBAN: {
        ENERGY: 1.3,
        MATERIALS: 0.8,
        TECHNOLOGY: 1.4,
        INTELLIGENCE: 1.3,
        MORALE: 1.1
      },
      WATER: {
        ENERGY: 1.4,
        MATERIALS: 0.7,
        TECHNOLOGY: 1.1,
        INTELLIGENCE: 0.9,
        MORALE: 0.8
      }
    }
  } as const;
  
  /**
   * AI configuration
   */
  export const AI_CONFIG = {
    BASE_AGGRESSION: 0.5,
    LEARNING_RATE: 0.1,
    PERSONALITY_TRAITS: {
      AGGRESSION: { MIN: 0.3, MAX: 0.8 },
      EXPANSION: { MIN: 0.4, MAX: 0.8 },
      TECHNOLOGY: { MIN: 0.3, MAX: 0.7 },
      DIPLOMACY: { MIN: 0.4, MAX: 0.8 },
      ECONOMICS: { MIN: 0.4, MAX: 0.7 }
    },
    STRATEGY_WEIGHTS: {
      MILITARY: 0.3,
      ECONOMIC: 0.3,
      TECHNOLOGICAL: 0.2,
      DIPLOMATIC: 0.2
    },
    THREAT_RESPONSE_THRESHOLD: 0.7
  } as const;
  
  /**
   * Player progression configuration
   */
  export const PROGRESSION_CONFIG = {
    EXPERIENCE_GAIN: {
      COMBAT_VICTORY: 100,
      REGION_CAPTURE: 50,
      RESEARCH_COMPLETE: 75,
      ALLIANCE_FORMED: 25,
      CYCLE_COMPLETION: 200
    },
    LEVEL_THRESHOLDS: Array.from({ length: 50 }, (_, i) => 
      Math.floor(1000 * Math.pow(1.5, i))
    ),
    MAX_LEVEL: 50,
    REWARDS: {
      LEVEL_UP: {
        COINS: 100,
        RESOURCES: {
          ENERGY: 500,
          MATERIALS: 500,
          TECHNOLOGY: 250,
          INTELLIGENCE: 100,
          MORALE: 100
        }
      }
    }
  } as const;
  
  /**
   * Game balance configuration
   */
  export const BALANCE_CONFIG = {
    VICTORY_CONDITIONS: {
      ECONOMIC: 0.6,  // Control 60% of total resources
      MILITARY: 0.7,  // Control 70% of regions
      TECHNOLOGICAL: 0.8, // Achieve 80% of max technology
      DIPLOMATIC: 0.75 // Form alliances with 75% of players
    },
    DEFEAT_CONDITIONS: {
      RESOURCE_DEPLETION: 0.1, // Less than 10% of starting resources
      TERRITORY_LOSS: 0.1,    // Less than 10% of territories
      MORALE_COLLAPSE: 0.2    // Less than 20% morale
    }
  } as const;
  
  // Export all configurations
  export const GAME_CONFIG = {
    CYCLE: CYCLE_CONFIG,
    RESOURCE: RESOURCE_CONFIG,
    UNIT: UNIT_CONFIG,
    COMBAT: COMBAT_CONFIG,
    REGION: REGION_CONFIG,
    AI: AI_CONFIG,
    PROGRESSION: PROGRESSION_CONFIG,
    BALANCE: BALANCE_CONFIG
  } as const;