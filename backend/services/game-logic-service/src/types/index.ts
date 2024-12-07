// Type definitions for the game logic service

export type PlayerId = string;
export type ActionId = string;
export type ResourceType = 'energy' | 'materials' | 'technology' | 'intelligence' | 'morale';

export enum GamePhase {
    PREPARATION = 'preparation',
    ACTION = 'action',
    RESOLUTION = 'resolution',
    INTERMISSION = 'intermission'
}

export enum ActionType {
    MOVE = 'MOVE',
    ATTACK = 'ATTACK',
    BUILD = 'BUILD',
    RESEARCH = 'RESEARCH',
    DIPLOMATIC = 'DIPLOMATIC',
    ECONOMIC = 'ECONOMIC'
}

export enum ActionStatus {
    QUEUED = 'QUEUED',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum GameEventType {
    PLAYER_ACTION = 'PLAYER_ACTION',
    WORLD_EVENT = 'WORLD_EVENT',
    AI_ACTION = 'AI_ACTION',
    SYSTEM_EVENT = 'SYSTEM_EVENT'
}

export enum WorldEventType {
    AI_UPRISING = 'AI_UPRISING',
    NATURAL_DISASTER = 'NATURAL_DISASTER',
    ECONOMIC_CRISIS = 'ECONOMIC_CRISIS',
    TECHNOLOGICAL_BREAKTHROUGH = 'TECHNOLOGICAL_BREAKTHROUGH'
}

export enum EventVisibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    ALLIANCE = 'ALLIANCE'
}

export interface PhaseConfig {
    duration: number;
    maxActionsPerPlayer: number;
    resourceMultiplier: number;
    aiAggressionMultiplier: number;
}

export interface GameAction {
    id: ActionId;
    type: ActionType;
    playerId: PlayerId;
    targetId?: string;
    resources?: Record<ResourceType, number>;
    priority: number;
    status: ActionStatus;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface QueuedAction extends GameAction {
    queuePosition: number;
    estimatedCompletionTime: Date;
}

export interface GameEvent {
    id: string;
    type: GameEventType;
    timestamp: Date;
    playerId?: PlayerId;
    data: Record<string, any>;
    visibility: EventVisibility;
}

export interface PlayerState {
    id: PlayerId;
    isActive: boolean;
    resources: Record<ResourceType, number>;
    actionsRemaining: number;
    performanceMetrics: {
        combatWinRate: number;
        resourceEfficiency: number;
        territoryControl: number;
        diplomaticSuccess: number;
    };
}

export interface AIState {
    aggressionLevel: number;
    expansionRate: number;
    techProgress: number;
    cycleNumber: number;
    phaseType: GamePhase;
    targetedRegions?: string[];
    predictedNextActions?: ActionType[];
}

export interface WorldState {
    phase: GamePhase;
    cycle: number;
    stability: number;
    combatEnabled: boolean;
    resourceMultiplier: number;
    activeEvents: GameEvent[];
    resourceAvailability: Record<ResourceType, number>;
}

export interface ServerGameCycle {
    cycleId: number;
    startTime: Date;
    endTime: Date;
    currentPhase: GamePhase;
    phaseEndTime: Date;
    totalPlayers: number;
    activePlayerCount: number;
    progress: number;
    remainingCycles: number;
    aiThreatLevel?: number;
}

export interface GameSession {
    id: string;
    players: Map<PlayerId, PlayerState>;
    actionQueue: QueuedAction[];
    worldState: WorldState;
    aiState: AIState;
    eventLog: GameEvent[];
}

export interface ResourceDistribution {
    playerId: PlayerId;
    resources: Record<ResourceType, number>;
    timestamp: Date;
    source: string;
}

export interface GameRewards {
    experience: number;
    coins: number;
    resources: Partial<Record<ResourceType, number>>;
}
