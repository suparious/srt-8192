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