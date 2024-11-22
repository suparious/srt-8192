import { PlayerId, GameSessionId } from '../../../../shared/types/game';
import { PlayStyle } from '../../../../shared/types/game';  // Assuming we move this enum here

export interface PlayerMetrics {
    averageActionsPerPhase: number;
    responseTime: number; // in milliseconds
    resourceEfficiency: number;
    strategicScore: number;
    diplomaticScore: number;
}

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

export interface PlayerGameState {
    resources: Resources;
    regions: RegionId[];
    structures?: string[];  // Consider making this StructureId[]
}
