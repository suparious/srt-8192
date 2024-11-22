import { z } from 'zod';
import {
  ResourceType,
  ResourceCost,
  ResourceMultipliers,
  Resources
} from '../types/resources';
import { RESOURCE_LIMITS } from '../constants/resourceLimits';

/**
 * Validate resource amount against storage limits
 */
export function validateStorageLimits(
  resources: Partial<ResourceCost>,
  currentLevel: number
): boolean {
  return Object.entries(resources).every(([resource, amount]) => {
    if (amount === undefined) return true;
    
    const maxStorage = calculateMaxStorage(resource as ResourceType, currentLevel);
    return amount >= 0 && amount <= maxStorage;
  });
}

/**
 * Calculate maximum storage capacity for a resource at given level
 */
function calculateMaxStorage(resourceType: ResourceType, level: number): number {
  const baseCapacity = RESOURCE_LIMITS.STORAGE.BASE_CAPACITY[resourceType];
  const levelIncrease = RESOURCE_LIMITS.STORAGE.LEVEL_INCREASE[resourceType] * (level - 1);
  const maxCapacity = RESOURCE_LIMITS.STORAGE.ABSOLUTE_MAX[resourceType];

  return Math.min(baseCapacity + levelIncrease, maxCapacity);
}

/**
 * Validate resource transfer between players/entities
 */
export function validateResourceTransfer(
  amount: Partial<ResourceCost>,
  fromResources: ResourceCost,
  toResources: ResourceCost,
  toLevel: number
): { valid: boolean; reason?: string } {
  // Check minimum transfer amounts
  for (const [resource, value] of Object.entries(amount)) {
    const minTransfer = RESOURCE_LIMITS.TRANSFER.MIN_TRANSFER[resource as ResourceType];
    if (value && value < minTransfer) {
      return { 
        valid: false, 
        reason: `Transfer amount for ${resource} below minimum (${minTransfer})`
      };
    }
  }

  // Check maximum transfer amounts
  for (const [resource, value] of Object.entries(amount)) {
    const maxTransfer = RESOURCE_LIMITS.TRANSFER.MAX_PER_TRANSACTION[resource as ResourceType];
    if (value && value > maxTransfer) {
      return { 
        valid: false, 
        reason: `Transfer amount for ${resource} above maximum (${maxTransfer})`
      };
    }
  }

  // Check if sender has sufficient resources
  for (const [resource, value] of Object.entries(amount)) {
    if (value && fromResources[resource as keyof ResourceCost] < value) {
      return { 
        valid: false, 
        reason: `Insufficient ${resource} for transfer`
      };
    }
  }

  // Check if receiver has sufficient storage
  for (const [resource, value] of Object.entries(amount)) {
    if (value) {
      const maxStorage = calculateMaxStorage(resource as ResourceType, toLevel);
      const newAmount = toResources[resource as keyof ResourceCost] + value;
      if (newAmount > maxStorage) {
        return { 
          valid: false, 
          reason: `Recipient storage capacity exceeded for ${resource}`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate resource conversion between types
 */
export function validateResourceConversion(
  from: ResourceType,
  to: ResourceType,
  amount: number
): { valid: boolean; reason?: string } {
  // Check minimum conversion amount
  if (amount < RESOURCE_LIMITS.CONVERSION.MIN_CONVERSION_AMOUNT) {
    return { 
      valid: false, 
      reason: `Conversion amount below minimum (${RESOURCE_LIMITS.CONVERSION.MIN_CONVERSION_AMOUNT})`
    };
  }

  // Check maximum conversion amount
  if (amount > RESOURCE_LIMITS.CONVERSION.MAX_CONVERSION_AMOUNT) {
    return { 
      valid: false, 
      reason: `Conversion amount above maximum (${RESOURCE_LIMITS.CONVERSION.MAX_CONVERSION_AMOUNT})`
    };
  }

  // Check if conversion ratio exists
  const ratio = RESOURCE_LIMITS.CONVERSION.BASE_CONVERSION[from]?.[to];
  if (!ratio) {
    return { 
      valid: false, 
      reason: `Cannot convert ${from} to ${to}`
    };
  }

  return { valid: true };
}

/**
 * Validate resource generation rates
 */
export function validateResourceGeneration(
  type: ResourceType,
  amount: number,
  multiplier: number = 1
): { valid: boolean; reason?: string } {
  const maxRate = RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER[type];
  const minRate = RESOURCE_LIMITS.PRODUCTION.MIN_RATE[type];
  const effectiveRate = amount * multiplier;

  if (effectiveRate < minRate) {
    return { 
      valid: false, 
      reason: `Generation rate below minimum (${minRate})`
    };
  }

  if (multiplier > maxRate) {
    return { 
      valid: false, 
      reason: `Production multiplier exceeds maximum (${maxRate})`
    };
  }

  return { valid: true };
}

/**
 * Validate decay calculations
 */
export function validateResourceDecay(
  resources: ResourceCost,
  decayRate: Partial<Record<ResourceType, number>>
): { valid: boolean; reason?: string } {
  for (const [resource, rate] of Object.entries(decayRate)) {
    const baseRate = RESOURCE_LIMITS.DECAY.BASE_DECAY_RATE[resource as ResourceType];
    const maxMultiplier = RESOURCE_LIMITS.DECAY.MAX_DECAY_MULTIPLIER;
    
    if (rate && rate > baseRate * maxMultiplier) {
      return { 
        valid: false, 
        reason: `Decay rate for ${resource} exceeds maximum (${baseRate * maxMultiplier})`
      };
    }

    const exemptionAmount = RESOURCE_LIMITS.DECAY.DECAY_EXEMPTION[resource as ResourceType];
    if (resources[resource as keyof ResourceCost] <= exemptionAmount) {
      return { 
        valid: false, 
        reason: `Resources below decay exemption threshold for ${resource} (${exemptionAmount})`
      };
    }
  }

  return { valid: true };
}

/**
 * Resource transaction schema
 */
export const resourceTransactionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  resources: z.record(z.number().min(0)),
  type: z.enum(['ALLOCATION', 'TRADE', 'PRODUCTION', 'MAINTENANCE', 'PENALTY']),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional()
});

export type ResourceTransaction = z.infer<typeof resourceTransactionSchema>;

/**
 * Resource multiplier schema
 */
export const resourceMultiplierSchema = z.object({
  energy: z.number().min(0).max(RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER.energy),
  materials: z.number().min(0).max(RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER.materials),
  technology: z.number().min(0).max(RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER.technology),
  intelligence: z.number().min(0).max(RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER.intelligence),
  morale: z.number().min(0).max(RESOURCE_LIMITS.PRODUCTION.MAX_MULTIPLIER.morale)
});

export type ValidatedResourceMultipliers = z.infer<typeof resourceMultiplierSchema>;