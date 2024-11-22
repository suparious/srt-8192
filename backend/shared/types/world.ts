import { WeatherCondition, RegionId, PlayerId, ActionType } from '../../../../shared/types/game';
import { Resources } from '../../../../shared/types/resources';

export interface WorldState {
    stability: number;
    resources: Resources;
    weather: WeatherEffect[];
    events: GameEvent[];
    aiActivity: AIMetrics;
    temperature: number;
    weatherConditions: WeatherCondition[];
    climateEffects?: ClimateEffect[];
}

export interface WeatherEffect {
    condition: WeatherCondition;
    severity: number;
    duration: number;
    effects: any[]; // Define specific effects structure
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
    potentialImpact: number;
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

export interface PredictedAction {
    type: ActionType;
    probability: number;
    targetRegion: RegionId;
    estimatedTiming: number;
    potentialImpact: number;
}

export interface WeatherCondition {
    type: string;
    severity: number;
    duration: number;
    effects: WeatherEffect[];
}

export interface WeatherEffect {
    target: string;
    modifier: number;
    duration: number;
}