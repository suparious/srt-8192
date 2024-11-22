// Core type-safe identifiers
export type EntityId = string & { readonly __brand: unique symbol };
export type PlayerId = EntityId;
export type RegionId = EntityId;
export type UnitId = EntityId;
export type StructureId = EntityId;
export type ResearchId = EntityId;
export type ActionId = EntityId;
export type SessionId = EntityId;

export enum GamePhase {
    PREPARATION = 'preparation',
    ACTION = 'action',
    RESOLUTION = 'resolution',
    INTERMISSION = 'intermission'
}

export enum UnitType {
    INFANTRY = 'infantry',
    MECHANIZED = 'mechanized',
    AERIAL = 'aerial',
    NAVAL = 'naval',
    SPECIAL = 'special'
}

export enum StructureType {
    FORTRESS = 'fortress',
    FACTORY = 'factory',
    LABORATORY = 'laboratory',
    OBSERVATORY = 'observatory',
    SHIELD = 'shield'
}

export enum RegionStatus {
    CONTROLLED = 'controlled',
    CONTESTED = 'contested',
    ENEMY = 'enemy',
    NEUTRAL = 'neutral',
    WASTELAND = 'wasteland'
}

export interface GameSession {
    id: SessionId;
    cycle: number;
    phase: GamePhase;
    players: Map<PlayerId, PlayerState>;
    regions: Map<RegionId, Region>;
    actionQueue: GameAction[];
    worldState: WorldState;
    timestamp: number;
    configuration: GameConfig;
}

export interface ServerGameCycle {
  cycleId: number;
  startTime: Date;
  endTime: Date;
  currentPhase: GamePhase;
  phaseEndTime: Date;
  totalPlayers: number;
  activePlayerCount: number;
  aiThreatLevel: number;
}

export interface PhaseConfig {
  duration: number;
  maxActionsPerPlayer: number;
  resourceMultiplier: number;
  aiAggressionMultiplier: number;
}

export enum SessionStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDING = 'ending',
  COMPLETED = 'completed'
}

export interface QueuedAction {
  id: ActionId;
  playerId: PlayerId;
  type: ActionType;
  priority: number;
  timestamp: Date;
  data: ActionData;
  status: ActionStatus;
  dependencies?: ActionId[];
}

export interface ActionData {
  sourceId: string;
  targetId: string;
  resources?: ResourceCost;
  units?: UnitId[];
  parameters?: Record<string, unknown>;
}

export enum ActionStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ServerRegion {
  id: RegionId;
  controller?: PlayerId;
  contestedBy: PlayerId[];
  units: Map<UnitId, ServerUnit>;
  resources: ResourceProduction;
  defensiveStructures: Structure[];
  economicStructures: Structure[];
  population: Population;
}

export interface ResourceProduction {
  base: ResourceCost;
  multipliers: ResourceMultipliers;
  efficiency: number;
}

export interface Structure {
  id: string;
  type: StructureType;
  level: number;
  health: number;
  efficiency: number;
}

export interface Population {
  total: number;
  growth: number;
  happiness: number;
  productivity: number;
  resistance: number;
}

export interface ServerUnit {
  id: UnitId;
  type: UnitType;
  owner: PlayerId;
  status: UnitStatus;
  health: number;
  experience: number;
  kills: number;
  movement: MovementData;
  specialAbilities: SpecialAbility[];
  abilityCooldowns: Map<string, number>;
}

export interface MovementData {
  speed: number;
  range: number;
  currentRegion: RegionId;
  destinationRegion?: RegionId;
  path?: RegionId[];
  progress: number;
}

export enum UnitStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  ENGAGING = 'engaging',
  DEFENDING = 'defending',
  RETREATING = 'retreating'
}
