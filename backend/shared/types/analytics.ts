import { ResourceCost } from './resources';

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