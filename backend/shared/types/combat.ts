import { PlayerId, RegionId, EntityId } from './game';
import { ResourceCost } from './resources';

export interface CombatResult {
  attackerId: PlayerId;
  defenderId: PlayerId;
  units: UnitCombatResult[];
  regionId: RegionId;
  territoryChanged: boolean;
  resourcesLost: ResourceCost;
  strategicValue: number;
}

export interface UnitCombatResult {
  unitId: UnitId;
  startingHealth: number;
  endingHealth: number;
  experienceGained: number;
  destroyed: boolean;
}

export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  resourceCost: Partial<ResourceCost>;
  effect: {
    type: 'damage' | 'buff' | 'debuff' | 'utility';
    magnitude: number;
    duration: number;
  };
}

export interface SpecialUnitAbility {
  name: string;
  effect: SpecialAbilityEffect;
  cooldown: number;
  requirements: {
    resources: Partial<ResourceCost>;
    conditions: string[];
  };
}

export type UnitId = EntityId;