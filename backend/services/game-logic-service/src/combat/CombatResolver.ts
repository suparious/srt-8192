import { EventEmitter } from 'events';
import {
  PlayerId,
  RegionId,
  UnitId,
  CombatResult,
  ServerUnit,
  GameEvent,
  GameEventType,
  EventVisibility,
  UnitType,
  UnitStatus,
  ResourceCost,
  ServerRegion
} from './types';

interface CombatModifiers {
  terrain: number;
  weather: number;
  morale: number;
  technology: number;
  leadership: number;
}

interface CombatantForces {
  playerId: PlayerId;
  regionId: RegionId;
  units: ServerUnit[];
  modifiers: CombatModifiers;
}

interface CombatPhaseResult {
  casualties: UnitId[];
  damaged: Map<UnitId, number>;
  retreated: UnitId[];
  experienceGained: Map<UnitId, number>;
}

export class CombatResolver extends EventEmitter {
  private readonly baseHitChance: number = 0.7;
  private readonly experienceMultiplier: number = 0.1;
  private readonly retreatThreshold: number = 0.3;
  private readonly baseResourceLoss: ResourceCost = {
    energy: 50,
    materials: 100,
    technology: 25,
    intelligence: 10,
    morale: 20
  };

  constructor() {
    super();
  }

  /**
   * Resolve a combat encounter between two forces
   */
  public resolveCombat(
    attacker: CombatantForces,
    defender: CombatantForces,
    battleDuration: number = 3
  ): CombatResult {
    const startTime = Date.now();
    const combatLog: CombatPhaseResult[] = [];
    let territoryChanged = false;

    // Resolve multiple phases of combat
    for (let phase = 0; phase < battleDuration; phase++) {
      const phaseResult = this.resolveCombatPhase(attacker, defender, phase);
      combatLog.push(phaseResult);

      // Update unit states based on phase results
      this.updateUnitsAfterPhase(attacker, defender, phaseResult);

      // Check for early battle conclusion
      if (this.isBattleDecided(attacker, defender)) {
        territoryChanged = this.shouldTerritoryChange(attacker, defender);
        break;
      }
    }

    // Calculate final battle results
    const result = this.calculateBattleResults(
      attacker,
      defender,
      combatLog,
      territoryChanged,
      startTime
    );

    // Emit combat result event
    this.emitCombatEvent(result);

    return result;
  }

  /**
   * Resolve a single phase of combat
   */
  private resolveCombatPhase(
    attacker: CombatantForces,
    defender: CombatantForces,
    phase: number
  ): CombatPhaseResult {
    const result: CombatPhaseResult = {
      casualties: [],
      damaged: new Map(),
      retreated: [],
      experienceGained: new Map()
    };

    // Process attacking units
    for (const unit of attacker.units) {
      if (!this.isUnitEffective(unit)) continue;

      const targets = this.selectTargets(unit, defender.units);
      for (const target of targets) {
        const damage = this.calculateDamage(
          unit,
          target,
          attacker.modifiers,
          defender.modifiers
        );

        if (damage > 0) {
          this.applyDamage(target, damage, result);
          const experience = this.calculateExperienceGain(damage);
          result.experienceGained.set(
            unit.id,
            (result.experienceGained.get(unit.id) || 0) + experience
          );
        }
      }
    }

    // Process defender counterattack
    for (const unit of defender.units) {
      if (!this.isUnitEffective(unit)) continue;

      const targets = this.selectTargets(unit, attacker.units);
      for (const target of targets) {
        const damage = this.calculateDamage(
          unit,
          target,
          defender.modifiers,
          attacker.modifiers
        );

        if (damage > 0) {
          this.applyDamage(target, damage, result);
          const experience = this.calculateExperienceGain(damage);
          result.experienceGained.set(
            unit.id,
            (result.experienceGained.get(unit.id) || 0) + experience
          );
        }
      }
    }

    // Check for retreats
    this.processRetreats(attacker, defender, result);

    return result;
  }

  /**
   * Calculate damage dealt by a unit
   */
  private calculateDamage(
    attacker: ServerUnit,
    defender: ServerUnit,
    attackerModifiers: CombatModifiers,
    defenderModifiers: CombatModifiers
  ): number {
    const baseHitChance = this.calculateHitChance(
      attacker,
      defender,
      attackerModifiers,
      defenderModifiers
    );

    if (Math.random() > baseHitChance) {
      return 0;
    }

    let damage = this.getUnitBaseDamage(attacker);
    
    // Apply modifiers
    damage *= attackerModifiers.technology;
    damage *= attackerModifiers.morale;
    damage *= (1 + attacker.experience * this.experienceMultiplier);
    
    // Apply defender modifiers
    damage *= (1 - defenderModifiers.terrain);
    damage *= (1 - defender.experience * this.experienceMultiplier * 0.5);

    return Math.max(1, Math.floor(damage));
  }

  /**
   * Calculate hit chance based on unit types and modifiers
   */
  private calculateHitChance(
    attacker: ServerUnit,
    defender: ServerUnit,
    attackerModifiers: CombatModifiers,
    defenderModifiers: CombatModifiers
  ): number {
    let hitChance = this.baseHitChance;

    // Apply unit type advantages
    hitChance *= this.getUnitTypeAdvantage(attacker.type, defender.type);

    // Apply modifiers
    hitChance *= attackerModifiers.technology;
    hitChance *= attackerModifiers.leadership;
    hitChance *= (1 + attacker.experience * this.experienceMultiplier);

    // Apply defender modifiers
    hitChance *= (1 - defenderModifiers.terrain);
    hitChance *= (1 - defenderModifiers.weather);

    return Math.min(0.95, Math.max(0.1, hitChance));
  }

  /**
   * Get base damage for a unit type
   */
  private getUnitBaseDamage(unit: ServerUnit): number {
    switch (unit.type) {
      case UnitType.INFANTRY:
        return 10;
      case UnitType.MECHANIZED:
        return 20;
      case UnitType.AERIAL:
        return 15;
      case UnitType.NAVAL:
        return 25;
      case UnitType.SPECIAL:
        return 30;
      default:
        return 10;
    }
  }

  /**
   * Calculate unit type advantage multiplier
   */
  private getUnitTypeAdvantage(attackerType: UnitType, defenderType: UnitType): number {
    const advantageMatrix: Record<UnitType, Record<UnitType, number>> = {
      [UnitType.INFANTRY]: {
        [UnitType.INFANTRY]: 1.0,
        [UnitType.MECHANIZED]: 0.7,
        [UnitType.AERIAL]: 0.5,
        [UnitType.NAVAL]: 0.3,
        [UnitType.SPECIAL]: 0.8
      },
      [UnitType.MECHANIZED]: {
        [UnitType.INFANTRY]: 1.5,
        [UnitType.MECHANIZED]: 1.0,
        [UnitType.AERIAL]: 0.7,
        [UnitType.NAVAL]: 0.5,
        [UnitType.SPECIAL]: 0.9
      },
      [UnitType.AERIAL]: {
        [UnitType.INFANTRY]: 1.8,
        [UnitType.MECHANIZED]: 1.5,
        [UnitType.AERIAL]: 1.0,
        [UnitType.NAVAL]: 1.2,
        [UnitType.SPECIAL]: 1.1
      },
      [UnitType.NAVAL]: {
        [UnitType.INFANTRY]: 2.0,
        [UnitType.MECHANIZED]: 1.7,
        [UnitType.AERIAL]: 0.8,
        [UnitType.NAVAL]: 1.0,
        [UnitType.SPECIAL]: 1.2
      },
      [UnitType.SPECIAL]: {
        [UnitType.INFANTRY]: 1.3,
        [UnitType.MECHANIZED]: 1.2,
        [UnitType.AERIAL]: 1.1,
        [UnitType.NAVAL]: 1.0,
        [UnitType.SPECIAL]: 1.0
      }
    };

    return advantageMatrix[attackerType][defenderType];
  }

  /**
   * Apply damage to a unit and update combat results
   */
  private applyDamage(
    unit: ServerUnit,
    damage: number,
    result: CombatPhaseResult
  ): void {
    unit.health = Math.max(0, unit.health - damage);
    
    if (unit.health === 0) {
      result.casualties.push(unit.id);
    } else {
      result.damaged.set(unit.id, damage);
    }
  }

  /**
   * Calculate experience gained from dealing damage
   */
  private calculateExperienceGain(damage: number): number {
    return Math.floor(damage * this.experienceMultiplier);
  }

  /**
   * Select valid targets for a unit
   */
  private selectTargets(attacker: ServerUnit, possibleTargets: ServerUnit[]): ServerUnit[] {
    // Filter out destroyed units
    const validTargets = possibleTargets.filter(unit => unit.health > 0);

    // Implement targeting priority based on unit types
    validTargets.sort((a, b) => {
      const advantageA = this.getUnitTypeAdvantage(attacker.type, a.type);
      const advantageB = this.getUnitTypeAdvantage(attacker.type, b.type);
      return advantageB - advantageA;
    });

    // Return top 3 targets or all if less than 3
    return validTargets.slice(0, 3);
  }

  /**
   * Process unit retreats
   */
  private processRetreats(
    attacker: CombatantForces,
    defender: CombatantForces,
    result: CombatPhaseResult
  ): void {
    // Check defender retreats
    for (const unit of defender.units) {
      if (!this.isUnitEffective(unit)) continue;

      const retreatChance = this.calculateRetreatChance(
        unit,
        defender.modifiers.morale,
        this.calculateForceStrength(defender.units) /
        this.calculateForceStrength(attacker.units)
      );

      if (Math.random() < retreatChance) {
        result.retreated.push(unit.id);
        unit.status = UnitStatus.RETREATING;
      }
    }

    // Check attacker retreats only if taking heavy losses
    if (this.calculateForceStrength(attacker.units) < 0.4) {
      for (const unit of attacker.units) {
        if (!this.isUnitEffective(unit)) continue;

        const retreatChance = this.calculateRetreatChance(
          unit,
          attacker.modifiers.morale,
          this.calculateForceStrength(attacker.units) /
          this.calculateForceStrength(defender.units)
        );

        if (Math.random() < retreatChance) {
          result.retreated.push(unit.id);
          unit.status = UnitStatus.RETREATING;
        }
      }
    }
  }

  /**
   * Calculate chance of unit retreat
   */
  private calculateRetreatChance(
    unit: ServerUnit,
    moraleModifier: number,
    forceRatio: number
  ): number {
    let retreatChance = this.retreatThreshold;

    // Units are less likely to retreat with more experience
    retreatChance *= (1 - unit.experience * this.experienceMultiplier);
    
    // Higher morale reduces retreat chance
    retreatChance *= (1 - moraleModifier);
    
    // More likely to retreat when outnumbered
    retreatChance *= (1 + Math.max(0, 1 - forceRatio));

    // Damaged units more likely to retreat
    retreatChance *= (1 + (1 - unit.health / 100));

    return Math.min(0.9, Math.max(0.1, retreatChance));
  }

  /**
   * Calculate total force strength
   */
  private calculateForceStrength(units: ServerUnit[]): number {
    return units.reduce((total, unit) => {
      if (this.isUnitEffective(unit)) {
        return total + (unit.health / 100) * this.getUnitBaseDamage(unit);
      }
      return total;
    }, 0);
  }

  /**
   * Check if a unit is still combat effective
   */
  private isUnitEffective(unit: ServerUnit): boolean {
    return unit.health > 0 && unit.status !== UnitStatus.RETREATING;
  }

  /**
   * Update unit states after a combat phase
   */
  private updateUnitsAfterPhase(
    attacker: CombatantForces,
    defender: CombatantForces,
    result: CombatPhaseResult
  ): void {
    // Update all units involved in combat
    const allUnits = [...attacker.units, ...defender.units];
    
    for (const unit of allUnits) {
      // Update experience
      const experienceGained = result.experienceGained.get(unit.id) || 0;
      unit.experience += experienceGained;

      // Update status for casualties
      if (result.casualties.includes(unit.id)) {
        unit.health = 0;
        unit.status = UnitStatus.RETREATING;
      }

      // Update damage tracking
      const damage = result.damaged.get(unit.id);
      if (damage) {
        unit.status = unit.health < 30 ? UnitStatus.RETREATING : UnitStatus.ENGAGING;
      }
    }
  }

  /**
   * Check if battle has been decided
   */
  private isBattleDecided(
    attacker: CombatantForces,
    defender: CombatantForces
  ): boolean {
    const attackerStrength = this.calculateForceStrength(attacker.units);
    const defenderStrength = this.calculateForceStrength(defender.units);

    // Battle is decided if one sided
    return attackerStrength === 0 || defenderStrength === 0 ||
           attackerStrength < attackerStrength * 0.2 ||
           defenderStrength < defenderStrength * 0.2;
  }

  /**
   * Determine if territory control should change
   */
  private shouldTerritoryChange(
    attacker: CombatantForces,
    defender: CombatantForces
  ): boolean {
    const attackerStrength = this.calculateForceStrength(attacker.units);
    const defenderStrength = this.calculateForceStrength(defender.units);

    // Territory changes if defender is decisively defeated
    return defenderStrength === 0 || (attackerStrength / defenderStrength) > 2;
  }

  /**
   * Calculate final battle results
   */
  private calculateBattleResults(
    attacker: CombatantForces,
    defender: CombatantForces,
    combatLog: CombatPhaseResult[],
    territoryChanged: boolean,
    startTime: number
  ): CombatResult {
    const duration = Date.now() - startTime;
    
    // Aggregate all unit results
    const unitResults = this.aggregateUnitResults(
      attacker.units,
      defender.units,
      combatLog
    );

    // Calculate resource losses
    const resourceLosses = this.calculateResourceLosses(
      unitResults,
      attacker.modifiers,
      defender.modifiers
    );

    return {
      attackerId: attacker.playerId,
      defenderId: defender.playerId,
      regionId: defender.regionId,
      territoryChanged,
      units: unitResults,
      duration,
      resourcesLost: resourceLosses,
      strategicValue: this.calculateStrategicValue(
        territoryChanged,
        resourceLosses,
        defender.regionId
      )
    };
  }

  /**
   * Aggregate unit results from combat log
   */
  private aggregateUnitResults(
    attackerUnits: ServerUnit[],
    defenderUnits: ServerUnit[],
    combatLog: CombatPhaseResult[]
  ): UnitCombatResult[] {
    const allUnits = [...attackerUnits, ...defenderUnits];
    const results: UnitCombatResult[] = [];

    for (const unit of allUnits) {
      const startingHealth = unit.health;
      let experienceGained = 0;

      // Sum up experience gained across all phases
      combatLog.forEach(phase => {
        experienceGained += phase.experienceGained.get(unit.id) || 0;
      });

      results.push({
        unitId: unit.id,
        startingHealth,
        endingHealth: unit.health,
        experienceGained,
        destroyed: unit.health === 0
      });
    }

    return results;
  }

  /**
   * Calculate resource losses from combat
   */
  private calculateResourceLosses(
    unitResults: UnitCombatResult[],
    attackerModifiers: CombatModifiers,
    defenderModifiers: CombatModifiers
  ): ResourceCost {
    const losses: ResourceCost = { ...this.baseResourceLoss };
    const totalDestroyed = unitResults.filter(result => result.destroyed).length;
    const totalDamaged = unitResults.filter(
      result => !result.destroyed && result.startingHealth > result.endingHealth
    ).length;

    // Scale losses based on battle intensity
    const intensityMultiplier = 1 + (totalDestroyed * 0.5) + (totalDamaged * 0.2);

    // Apply modifiers
    const combinedTechLevel = (attackerModifiers.technology + defenderModifiers.technology) / 2;
    
    return {
      energy: Math.floor(losses.energy * intensityMultiplier * combinedTechLevel),
      materials: Math.floor(losses.materials * intensityMultiplier),
      technology: Math.floor(losses.technology * intensityMultiplier * combinedTechLevel),
      intelligence: Math.floor(losses.intelligence * intensityMultiplier),
      morale: Math.floor(losses.morale * intensityMultiplier)
    };
  }

  /**
   * Calculate strategic value of the battle
   */
  private calculateStrategicValue(
    territoryChanged: boolean,
    resourcesLost: ResourceCost,
    regionId: RegionId
  ): number {
    let value = 0;

    // Territory control is highly valuable
    if (territoryChanged) {
      value += 1000;
    }

    // Resource losses reduce strategic value
    const totalLosses = Object.values(resourcesLost).reduce((sum, val) => sum + val, 0);
    value -= totalLosses * 0.5;

    // Add base value for having a battle
    value += 100;

    return Math.max(0, Math.floor(value));
  }

  /**
   * Emit combat event
   */
  private emitCombatEvent(result: CombatResult): void {
    const event: GameEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: GameEventType.COMBAT_RESULT,
      data: result,
      visibility: EventVisibility.PUBLIC
    };

    this.emit('combatResolved', event);
  }

  /**
   * Update region control after combat
   */
  public updateRegionControl(
    region: ServerRegion,
    result: CombatResult
  ): void {
    if (result.territoryChanged) {
      const previousController = region.controller;
      region.controller = result.attackerId;
      
      // Add to contested regions if defender still has units
      const defenderUnits = result.units.filter(
        unit => !unit.destroyed && unit.unitId.startsWith(result.defenderId)
      );
      
      if (defenderUnits.length > 0) {
        if (!region.contestedBy.includes(result.defenderId)) {
          region.contestedBy.push(result.defenderId);
        }
      } else {
        // Remove defender from contested regions
        region.contestedBy = region.contestedBy.filter(id => id !== result.defenderId);
      }

      this.emit('regionControlChanged', {
        regionId: region.id,
        newController: result.attackerId,
        previousController,
        contested: region.contestedBy.length > 0
      });
    }
  }
}
