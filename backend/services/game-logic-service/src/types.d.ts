// Type-safe identifiers using branded types
type EntityId = string & { readonly __brand: unique symbol };

export type PlayerId = EntityId;
export type RegionId = EntityId;
export type UnitId = EntityId;
export type StructureId = EntityId;
export type ResearchId = EntityId;
export type ActionId = EntityId;
export type SessionId = EntityId;

// Core Enums
export enum GamePhase {
  PREPARATION = 'preparation',
  ACTION = 'action',
  RESOLUTION = 'resolution',
  INTERMISSION = 'intermission'
}

export enum ResourceType {
  ENERGY = 'energy',
  MATERIALS = 'materials',
  TECHNOLOGY = 'technology',
  INTELLIGENCE = 'intelligence',
  MORALE = 'morale'
}

export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  BUILD = 'build',
  RESEARCH = 'research',
  DIPLOMATIC = 'diplomatic',
  ECONOMIC = 'economic'
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

export enum WeatherCondition {
  CLEAR = 'clear',
  STORMY = 'stormy',
  EXTREME_HEAT = 'extreme_heat',
  EXTREME_COLD = 'extreme_cold',
  ELECTROMAGNETIC_STORM = 'electromagnetic_storm'
}

// Resource Management
export interface Resources {
  [ResourceType.ENERGY]: number;
  [ResourceType.MATERIALS]: number;
  [ResourceType.TECHNOLOGY]: number;
  [ResourceType.INTELLIGENCE]: number;
  [ResourceType.MORALE]: number;
}

export interface ResourceModifiers {
  production: Partial<Resources>;
  consumption: Partial<Resources>;
  efficiency: number;
}

// Game World
export interface Coordinate {
  x: number;
  y: number;
}

export interface Region {
  id: RegionId;
  name: string;
  status: RegionStatus;
  controller?: PlayerId;
  contestedBy: PlayerId[];
  coordinates: Coordinate;
  resources: ResourceModifiers;
  structures: Structure[];
  units: Unit[];
  population: number;
  stability: number;
  weatherConditions: WeatherEffect[];
}

export interface Structure {
  id: StructureId;
  type: StructureType;
  owner: PlayerId;
  level: number;
  health: number;
  efficiency: number;
  resourceModifiers: ResourceModifiers;
}

export interface Unit {
  id: UnitId;
  type: UnitType;
  owner: PlayerId;
  position: Coordinate;
  health: number;
  experience: number;
  status: UnitStatus;
  capabilities: UnitCapabilities;
}

export interface UnitStatus {
  action: 'idle' | 'moving' | 'attacking' | 'defending' | 'retreating';
  effects: StatusEffect[];
  cooldowns: Map<string, number>;
}

export interface UnitCapabilities {
  movement: number;
  attack: number;
  defense: number;
  range: number;
  specialAbilities: string[];
}

// Player State
export interface PlayerState {
  id: PlayerId;
  name: string;
  resources: Resources;
  regions: RegionId[];
  units: UnitId[];
  structures: StructureId[];
  research: Research[];
  actionPoints: number;
  status: {
    online: boolean;
    lastActive: number;
    currentAction?: string;
  };
}

export interface Research {
  id: ResearchId;
  name: string;
  level: number;
  progress: number;
  effects: ResearchEffect[];
  requirements: {
    resources: Partial<Resources>;
    prerequisites: ResearchId[];
  };
}

// Game Actions
export interface GameAction {
  id: ActionId;
  type: ActionType;
  playerId: PlayerId;
  source: RegionId | UnitId;
  target: RegionId | UnitId | Coordinate;
  resources?: Partial<Resources>;
  units?: UnitId[];
  options?: Record<string, unknown>;
  timestamp: number;
  status: ActionStatus;
}

export interface ActionStatus {
  phase: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: ActionResult;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  effects: GameEffect[];
  resourceChanges: Partial<Resources>;
  message: string;
}

// Effects System
export interface GameEffect {
  type: string;
  target: PlayerId | RegionId | UnitId;
  magnitude: number;
  duration: number;
  stackable: boolean;
}

export interface StatusEffect extends GameEffect {
  modifier: number;
  condition: string;
}

export interface WeatherEffect extends GameEffect {
  condition: WeatherCondition;
  resourceModifiers: Partial<Resources>;
}

export interface ResearchEffect extends GameEffect {
  bonusType: string;
  value: number;
}

// Game Session
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

export interface WorldState {
  stability: number;
  resources: Resources;
  weather: WeatherEffect[];
  events: GameEvent[];
  aiActivity: AIMetrics;
}

export interface AIMetrics {
  aggressionLevel: number;
  expansionRate: number;
  techProgress: number;
  targetRegions: RegionId[];
  predictedActions: PredictedAction[];
}

export interface PredictedAction {
  type: ActionType;
  probability: number;
  targetRegion: RegionId;
  estimatedTiming: number;
}

export interface GameEvent {
  id: string;
  type: string;
  source?: string;
  target?: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface GameConfig {
  cycleLength: number;
  maxPlayers: number;
  mapSize: {
    width: number;
    height: number;
  };
  startingResources: Resources;
  aiDifficulty: number;
  features: string[];
}