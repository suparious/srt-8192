// Core game state types for the 8192 Leadership Simulator Backend

import { Opaque } from 'type-fest';

// Type-safe identifiers
export type PlayerId = Opaque<string, 'PlayerId'>;
export type GameSessionId = Opaque<string, 'GameSessionId'>;
export type RegionId = Opaque<string, 'RegionId'>;
export type UnitId = Opaque<string, 'UnitId'>;
export type ActionId = Opaque<string, 'ActionId'>;
export type ResearchId = Opaque<string, 'ResearchId'>;

// Cycle and timing related types
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

export enum GamePhase {
  PREPARATION = 'preparation',
  ACTION = 'action',
  RESOLUTION = 'resolution',
  INTERMISSION = 'intermission'
}

export interface PhaseConfig {
  duration: number; // in seconds
  maxActionsPerPlayer: number;
  resourceMultiplier: number;
  aiAggressionMultiplier: number;
}

// Server-side player state
export interface ServerPlayer {
  id: PlayerId;
  sessionId: GameSessionId;
  connectionStatus: ConnectionStatus;
  lastActive: Date;
  matchmakingData: MatchmakingData;
  gameState: PlayerGameState;
  performanceMetrics: PlayerMetrics;
}

export interface MatchmakingData {
  rating: number;
  preferredRegions: string[];
  languagePreferences: string[];
  playStyle: PlayStyle[];
  averageSessionDuration: number;
  lastMatchTime?: Date;
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  IDLE = 'idle'
}

export interface PlayerMetrics {
  averageActionsPerPhase: number;
  responseTime: number; // in milliseconds
  resourceEfficiency: number;
  strategicScore: number;
  diplomaticScore: number;
}

// Game session state
export interface GameSession {
  id: GameSessionId;
  status: SessionStatus;
  players: Map<PlayerId, ServerPlayer>;
  regions: Map<RegionId, ServerRegion>;
  actionQueue: QueuedAction[];
  eventLog: GameEvent[];
  worldState: WorldState;
  startTime: Date;
  lastUpdateTime: Date;
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

export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  BUILD = 'build',
  RESEARCH = 'research',
  DIPLOMATIC = 'diplomatic',
  ECONOMIC = 'economic'
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

// World state and environmental factors
export interface WorldState {
  globalStability: number;
  resourceAvailability: ResourceMultipliers;
  activeEvents: WorldEvent[];
  aiActivity: AIActivityMetrics;
  temperature: number;
  weatherConditions: WeatherCondition[];
}

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  severity: number;
  affectedRegions: RegionId[];
  duration: number;
  effects: EventEffect[];
}

export enum WorldEventType {
  NATURAL_DISASTER = 'natural_disaster',
  ECONOMIC_CRISIS = 'economic_crisis',
  TECHNOLOGICAL_BREAKTHROUGH = 'technological_breakthrough',
  SOCIAL_UNREST = 'social_unrest',
  AI_UPRISING = 'ai_uprising'
}

export interface AIActivityMetrics {
  aggressionLevel: number;
  expansionRate: number;
  techProgress: number;
  targetedRegions: RegionId[];
  predictedNextActions: PredictedAction[];
}

// Resource management
export interface ResourceCost {
  energy: number;
  materials: number;
  technology: number;
  intelligence: number;
  morale: number;
}

export interface ResourceMultipliers {
  energy: number;
  materials: number;
  technology: number;
  intelligence: number;
  morale: number;
}

// Combat and military
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

// Event logging
export interface GameEvent {
  id: string;
  timestamp: Date;
  type: GameEventType;
  playerId?: PlayerId;
  data: Record<string, unknown>;
  visibility: EventVisibility;
}

export enum GameEventType {
  PLAYER_ACTION = 'player_action',
  COMBAT_RESULT = 'combat_result',
  RESOURCE_CHANGE = 'resource_change',
  TERRITORY_CHANGE = 'territory_change',
  AI_ACTION = 'ai_action',
  WORLD_EVENT = 'world_event'
}

export enum EventVisibility {
  PUBLIC = 'public',
  PLAYER = 'player',
  ALLIES = 'allies',
  ADMIN = 'admin'
}

// Player preferences and settings
export interface PlayerPreferences {
  notifications: NotificationPreferences;
  interfaceSettings: InterfaceSettings;
  gameplaySettings: GameplaySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inGame: boolean;
  types: Record<GameEventType, boolean>;
}

export interface InterfaceSettings {
  theme: string;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  autoSave: boolean;
}

export interface GameplaySettings {
  autoResolveSkirmishes: boolean;
  confirmActions: boolean;
  showTutorials: boolean;
  difficultyPreference: DifficultyLevel;
}

export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXTREME = 'extreme'
}

// Analytical types for game balance and monitoring
export interface GameMetrics {
  activeGames: number;
  totalPlayers: number;
  averageGameDuration: number;
  resourceDistribution: ResourceDistribution;
  aiWinRate: number;
  playerRetention: RetentionMetrics;
}

export interface ResourceDistribution {
  mean: ResourceCost;
  standardDeviation: ResourceCost;
  min: ResourceCost;
  max: ResourceCost;
}

export interface RetentionMetrics {
  daily: number;
  weekly: number;
  monthly: number;
  cycleBased: number;
}

export enum PlayStyle {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  DIPLOMATIC = 'diplomatic',
  ECONOMIC = 'economic',
  TECHNOLOGICAL = 'technological'
}

// Region and territory management
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

export enum StructureType {
  FORTRESS = 'fortress',
  FACTORY = 'factory',
  LABORATORY = 'laboratory',
  OBSERVATORY = 'observatory',
  SHIELD_GENERATOR = 'shield_generator'
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
}

export enum UnitType {
  INFANTRY = 'infantry',
  MECHANIZED = 'mechanized',
  AERIAL = 'aerial',
  NAVAL = 'naval',
  SPECIAL = 'special'
}

export enum UnitStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  ENGAGING = 'engaging',
  DEFENDING = 'defending',
  RETREATING = 'retreating'
}

export interface MovementData {
  speed: number;
  range: number;
  currentRegion: RegionId;
  destinationRegion?: RegionId;
  path?: RegionId[];
  progress: number;
}

export interface PredictedAction {
  type: ActionType;
  probability: number;
  targetRegion: RegionId;
  estimatedTiming: number;
  potentialImpact: number;
}

export interface WeatherCondition {
  type: WeatherType;
  severity: number;
  duration: number;
  effects: WeatherEffect[];
}

export enum WeatherType {
  CLEAR = 'clear',
  STORMY = 'stormy',
  EXTREME_HEAT = 'extreme_heat',
  EXTREME_COLD = 'extreme_cold',
  ELECTROMAGNETIC_STORM = 'electromagnetic_storm'
}

export interface WeatherEffect {
  target: EffectTarget;
  modifier: number;
  duration: number;
}

export enum EffectTarget {
  MOVEMENT = 'movement',
  COMBAT = 'combat',
  PRODUCTION = 'production',
  VISIBILITY = 'visibility',
  MORALE = 'morale'
}