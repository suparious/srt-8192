import { EventEmitter } from 'events';
import {
    GameSession,
    PlayerId,
    PlayerState,
    GameAction,
    QueuedAction,
    GameEvent,
    WorldState,
    AIState,
    ResourceType,
    GamePhase,
    ActionStatus,
    GameRewards
} from '../types';

export class GameState extends EventEmitter {
    private session: GameSession;

    constructor() {
        super();
        this.session = this.createInitialSession();
    }

    private createInitialSession(): GameSession {
        return {
            id: crypto.randomUUID(),
            players: new Map<PlayerId, PlayerState>(),
            actionQueue: [],
            worldState: {
                phase: GamePhase.INTERMISSION,
                cycle: 0,
                stability: 1.0,
                combatEnabled: false,
                resourceMultiplier: 1.0,
                activeEvents: [],
                resourceAvailability: {
                    energy: 1.0,
                    materials: 1.0,
                    technology: 1.0,
                    intelligence: 1.0,
                    morale: 1.0
                }
            },
            aiState: {
                aggressionLevel: 0.5,
                expansionRate: 0.1,
                techProgress: 0,
                cycleNumber: 0,
                phaseType: GamePhase.INTERMISSION
            },
            eventLog: []
        };
    }

    public getSessionState(): GameSession {
        return this.session;
    }

    public addPlayer(playerId: PlayerId): void {
        if (!this.session.players.has(playerId)) {
            const initialState: PlayerState = {
                id: playerId,
                isActive: true,
                resources: {
                    energy: 1000,
                    materials: 1000,
                    technology: 500,
                    intelligence: 250,
                    morale: 100
                },
                actionsRemaining: 0,
                performanceMetrics: {
                    combatWinRate: 0,
                    resourceEfficiency: 0,
                    territoryControl: 0,
                    diplomaticSuccess: 0
                }
            };

            this.session.players.set(playerId, initialState);
            this.emit('playerJoined', { playerId, timestamp: new Date() });
        }
    }

    public removePlayer(playerId: PlayerId): void {
        if (this.session.players.has(playerId)) {
            this.session.players.delete(playerId);
            this.emit('playerLeft', { playerId, timestamp: new Date() });
        }
    }

    public queueAction(action: GameAction): void {
        const queuedAction: QueuedAction = {
            ...action,
            queuePosition: this.session.actionQueue.length,
            estimatedCompletionTime: new Date(Date.now() + 1000) // Simple estimation
        };

        this.session.actionQueue.push(queuedAction);
        this.emit('actionQueued', queuedAction);
    }

    public async processAction(action: QueuedAction): Promise<boolean> {
        try {
            action.status = ActionStatus.PROCESSING;
            
            // Validate action
            if (!this.validateAction(action)) {
                action.status = ActionStatus.FAILED;
                return false;
            }

            // Process resources
            if (action.resources) {
                const player = this.session.players.get(action.playerId);
                if (player) {
                    for (const [resource, amount] of Object.entries(action.resources)) {
                        player.resources[resource as ResourceType] -= amount;
                    }
                }
            }

            action.status = ActionStatus.COMPLETED;
            this.emit('actionProcessed', { action, success: true });
            return true;
        } catch (error) {
            action.status = ActionStatus.FAILED;
            this.emit('actionFailed', { action, error });
            return false;
        }
    }

    public async processNextAction(): Promise<void> {
        const nextAction = this.session.actionQueue.find(
            action => action.status === ActionStatus.QUEUED
        );

        if (nextAction) {
            await this.processAction(nextAction);
        }
    }

    private validateAction(action: GameAction): boolean {
        const player = this.session.players.get(action.playerId);
        if (!player) return false;

        // Check resources
        if (action.resources) {
            for (const [resource, amount] of Object.entries(action.resources)) {
                if (player.resources[resource as ResourceType] < amount) {
                    return false;
                }
            }
        }

        return true;
    }

    public updateWorldState(updates: Partial<WorldState>): void {
        this.session.worldState = {
            ...this.session.worldState,
            ...updates
        };
        this.emit('worldStateUpdated', this.session.worldState);
    }

    public updateAIActivity(updates: Partial<AIState>): void {
        this.session.aiState = {
            ...this.session.aiState,
            ...updates
        };
        this.emit('aiStateUpdated', this.session.aiState);
    }

    public addPlayerResources(playerId: PlayerId, resources: Partial<Record<ResourceType, number>>): void {
        const player = this.session.players.get(playerId);
        if (player) {
            for (const [resource, amount] of Object.entries(resources)) {
                player.resources[resource as ResourceType] += amount;
            }
            this.emit('resourcesAdded', { playerId, resources });
        }
    }

    public distributeRewards(playerId: PlayerId, rewards: GameRewards): void {
        const player = this.session.players.get(playerId);
        if (player) {
            // Add resources from rewards
            if (rewards.resources) {
                this.addPlayerResources(playerId, rewards.resources);
            }
            
            this.emit('rewardsDistributed', {
                playerId,
                rewards,
                timestamp: new Date()
            });
        }
    }

    public cleanup(): void {
        // Remove completed actions from queue
        this.session.actionQueue = this.session.actionQueue.filter(
            action => action.status === ActionStatus.QUEUED
        );

        // Clear expired events
        const now = new Date();
        this.session.worldState.activeEvents = this.session.worldState.activeEvents.filter(
            event => event.timestamp > new Date(now.getTime() - 24 * 60 * 60 * 1000) // Keep last 24 hours
        );

        this.emit('stateCleanup', {
            timestamp: new Date(),
            queueSize: this.session.actionQueue.length,
            activeEvents: this.session.worldState.activeEvents.length
        });
    }

    public logEvent(event: GameEvent): void {
        this.session.eventLog.push(event);
        this.emit('eventLogged', event);
    }
}
