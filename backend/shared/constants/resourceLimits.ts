import { ResourceType } from '../types/resources';
import { RESOURCE_CONFIG } from './gameConfig';

/**
 * Storage capacity limits by player level
 */
export const STORAGE_CAPACITY_LIMITS = {
  // Base storage at level 1
  BASE_CAPACITY: RESOURCE_CONFIG.STORAGE_LIMITS,

  // Storage increase per level (additive)
  LEVEL_INCREASE: {
    [ResourceType.ENERGY]: 500,      // +500 per level
    [ResourceType.MATERIALS]: 500,   // +500 per level
    [ResourceType.TECHNOLOGY]: 250,  // +250 per level
    [ResourceType.INTELLIGENCE]: 100, // +100 per level
    [ResourceType.MORALE]: 50        // +50 per level
  },

  // Maximum possible storage at max level
  ABSOLUTE_MAX: {
    [ResourceType.ENERGY]: 50000,
    [ResourceType.MATERIALS]: 50000,
    [ResourceType.TECHNOLOGY]: 25000,
    [ResourceType.INTELLIGENCE]: 10000,
    [ResourceType.MORALE]: 5000
  }
} as const;

/**
 * Production rate limits
 */
export const PRODUCTION_LIMITS = {
  // Base production rates
  BASE_RATE: RESOURCE_CONFIG.BASE_PRODUCTION,

  // Maximum production rate multiplier
  MAX_MULTIPLIER: {
    [ResourceType.ENERGY]: 5.0,      // 5x base rate
    [ResourceType.MATERIALS]: 5.0,   // 5x base rate
    [ResourceType.TECHNOLOGY]: 3.0,  // 3x base rate
    [ResourceType.INTELLIGENCE]: 2.5, // 2.5x base rate
    [ResourceType.MORALE]: 2.0       // 2x base rate
  },

  // Minimum production rate (cannot go lower)
  MIN_RATE: {
    [ResourceType.ENERGY]: 10,
    [ResourceType.MATERIALS]: 10,
    [ResourceType.TECHNOLOGY]: 5,
    [ResourceType.INTELLIGENCE]: 2,
    [ResourceType.MORALE]: 5
  }
} as const;

/**
 * Transfer and trading limits
 */
export const TRANSFER_LIMITS = {
  // Minimum amount that can be transferred
  MIN_TRANSFER: {
    [ResourceType.ENERGY]: 10,
    [ResourceType.MATERIALS]: 10,
    [ResourceType.TECHNOLOGY]: 5,
    [ResourceType.INTELLIGENCE]: 1,
    [ResourceType.MORALE]: 5
  },

  // Maximum amount that can be transferred in a single transaction
  MAX_PER_TRANSACTION: {
    [ResourceType.ENERGY]: 5000,
    [ResourceType.MATERIALS]: 5000,
    [ResourceType.TECHNOLOGY]: 2500,
    [ResourceType.INTELLIGENCE]: 1000,
    [ResourceType.MORALE]: 500
  },

  // Maximum transfers per cycle
  MAX_TRANSACTIONS_PER_CYCLE: 10,

  // Trading cooldown in seconds
  TRADING_COOLDOWN: 300, // 5 minutes

  // Transaction fees (percentage)
  TRANSACTION_FEES: RESOURCE_CONFIG.TRADE_FEES
} as const;

/**
 * Resource decay and maintenance
 */
export const DECAY_LIMITS = {
  // Base decay rates per cycle
  BASE_DECAY_RATE: RESOURCE_CONFIG.DECAY_RATES,

  // Maximum decay rate multiplier
  MAX_DECAY_MULTIPLIER: 2.0,

  // Minimum resources exempt from decay
  DECAY_EXEMPTION: {
    [ResourceType.ENERGY]: 100,
    [ResourceType.MATERIALS]: 100,
    [ResourceType.TECHNOLOGY]: 50,
    [ResourceType.INTELLIGENCE]: 20,
    [ResourceType.MORALE]: 50
  }
} as const;

/**
 * Resource generation and collection
 */
export const GENERATION_LIMITS = {
  // Resource node generation ranges
  NODE_GENERATION: {
    [ResourceType.ENERGY]: {
      MIN: 50,
      MAX: 200,
      DEPLETION_RATE: 0.1  // 10% per collection
    },
    [ResourceType.MATERIALS]: {
      MIN: 50,
      MAX: 200,
      DEPLETION_RATE: 0.15 // 15% per collection
    },
    [ResourceType.TECHNOLOGY]: {
      MIN: 25,
      MAX: 100,
      DEPLETION_RATE: 0.2  // 20% per collection
    },
    [ResourceType.INTELLIGENCE]: {
      MIN: 10,
      MAX: 50,
      DEPLETION_RATE: 0.25 // 25% per collection
    },
    [ResourceType.MORALE]: {
      MIN: 25,
      MAX: 100,
      DEPLETION_RATE: 0.3  // 30% per collection
    }
  },

  // Resource respawn configuration
  RESPAWN_CONFIG: {
    MIN_CYCLES: 5,    // Minimum cycles before respawn
    MAX_CYCLES: 10,   // Maximum cycles before respawn
    RICHNESS_MULTIPLIER: {
      MIN: 0.8,       // Minimum richness compared to original
      MAX: 1.2        // Maximum richness compared to original
    }
  }
} as const;

/**
 * Emergency and critical thresholds
 */
export const CRITICAL_THRESHOLDS = {
  // Critical low thresholds (percentage of storage)
  CRITICAL_LOW: {
    [ResourceType.ENERGY]: 0.1,      // 10%
    [ResourceType.MATERIALS]: 0.1,   // 10%
    [ResourceType.TECHNOLOGY]: 0.15, // 15%
    [ResourceType.INTELLIGENCE]: 0.2, // 20%
    [ResourceType.MORALE]: 0.25      // 25%
  },

  // Emergency reserve requirements
  EMERGENCY_RESERVE: {
    [ResourceType.ENERGY]: 50,
    [ResourceType.MATERIALS]: 50,
    [ResourceType.TECHNOLOGY]: 25,
    [ResourceType.INTELLIGENCE]: 10,
    [ResourceType.MORALE]: 25
  },

  // Recovery rate multipliers when below critical
  RECOVERY_MULTIPLIERS: {
    [ResourceType.ENERGY]: 1.5,
    [ResourceType.MATERIALS]: 1.5,
    [ResourceType.TECHNOLOGY]: 1.3,
    [ResourceType.INTELLIGENCE]: 1.2,
    [ResourceType.MORALE]: 1.4
  }
} as const;

/**
 * Resource conversion ratios
 */
export const CONVERSION_RATIOS = {
  // Base conversion rates between resources
  BASE_CONVERSION: {
    [ResourceType.ENERGY]: {
      [ResourceType.MATERIALS]: 0.8,
      [ResourceType.TECHNOLOGY]: 0.5,
      [ResourceType.INTELLIGENCE]: 0.3,
      [ResourceType.MORALE]: 0.4
    },
    [ResourceType.MATERIALS]: {
      [ResourceType.ENERGY]: 1.2,
      [ResourceType.TECHNOLOGY]: 0.6,
      [ResourceType.INTELLIGENCE]: 0.4,
      [ResourceType.MORALE]: 0.5
    },
    [ResourceType.TECHNOLOGY]: {
      [ResourceType.ENERGY]: 2.0,
      [ResourceType.MATERIALS]: 1.6,
      [ResourceType.INTELLIGENCE]: 0.7,
      [ResourceType.MORALE]: 0.8
    },
    [ResourceType.INTELLIGENCE]: {
      [ResourceType.ENERGY]: 3.0,
      [ResourceType.MATERIALS]: 2.5,
      [ResourceType.TECHNOLOGY]: 1.4,
      [ResourceType.MORALE]: 1.2
    },
    [ResourceType.MORALE]: {
      [ResourceType.ENERGY]: 2.5,
      [ResourceType.MATERIALS]: 2.0,
      [ResourceType.TECHNOLOGY]: 1.2,
      [ResourceType.INTELLIGENCE]: 0.8
    }
  },

  // Conversion efficiency (percentage of theoretical maximum)
  CONVERSION_EFFICIENCY: 0.8, // 80% efficient

  // Minimum amount for conversion
  MIN_CONVERSION_AMOUNT: 10,

  // Maximum amount for conversion
  MAX_CONVERSION_AMOUNT: 1000
} as const;

// Export all resource limits
export const RESOURCE_LIMITS = {
  STORAGE: STORAGE_CAPACITY_LIMITS,
  PRODUCTION: PRODUCTION_LIMITS,
  TRANSFER: TRANSFER_LIMITS,
  DECAY: DECAY_LIMITS,
  GENERATION: GENERATION_LIMITS,
  CRITICAL: CRITICAL_THRESHOLDS,
  CONVERSION: CONVERSION_RATIOS
} as const;