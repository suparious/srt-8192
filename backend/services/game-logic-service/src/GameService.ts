import { EventEmitter } from 'events';
import { GameState } from './core/GameState';
import { GameLoop, CYCLE_DURATION_MS, TOTAL_CYCLES } from './core/GameLoop';
import { TurnManager } from './core/TurnManager';
import {
    PlayerId,
    GameAction,
    GamePhase,
    ServerGameCycle,
    ActionType,
    GameRewards
} from './types';

export class GameService extends EventEmitter {
    private gameState: GameState;
    private gameLoop: GameLoop;
    private turnManager: TurnManager;
    private isRunning: boolean = false;

    constructor() {
        super();
        this.gameState = new GameState();
        this.gameLoop = new GameLoop(this.gameState);
        this.turnManager = new TurnManager(this.gameState);
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        // Game Loop Events
        this.gameLoop.on('gameLoopStarted', this.handleGameLoopStarted.bind(this));
        this.gameLoop.on('cycleStarted', this.handleCycleStarted.bind(this));
        this.gameLoop.on('phaseStarted', this.handlePhaseStarted.bind(this));
        this.gameLoop.on('gameCompleted', this.handleGameCompleted.bind(this));

        // Turn Manager Events
        this.turnManager.on('actionProcessed', this.handleActionProcessed.bind(this));
        this.turnManager.on('rewardsDistributed', this.handleRewardsDistributed.bind(this));

        // Game State Events
        this.gameState.on('playerJoined', this.handlePlayerJoined.bind(this));
        this.gameState.on('playerLeft', this.handlePlayerLeft.bind(this));
        this.gameState.on('worldStateUpdated', this.handleWorldStateUpdated.bind(this));
    }

    /**
     * Start the game service
     */
    public start(): void {
        if (this.isRunning) return;
        
        console.log(`Starting game service with ${CYCLE_DURATION_MS}ms cycles`);
        console.log(`Total game duration: ${TOTAL_CYCLES} cycles`);
        
        this.isRunning = true;
        this.gameLoop.start();
        this.turnManager.startCycle();
        
        this.emit('serviceStarted', {
            timestamp: new Date(),
            config: {
                cycleDuration: CYCLE_DURATION_MS,
                totalCycles: TOTAL_CYCLES
            }
        });
    }

    /**
     * Stop the game service
     */
    public stop(): void {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.gameLoop.stop();
        this.turnManager.stop();
        
        this.emit('serviceStopped', {
            timestamp: new Date(),
            finalState: this.gameState.getSessionState()
        });
    }

    /**
     * Add a new player to the game
     */
    public addPlayer(playerId: PlayerId): void {
        this.gameState.addPlayer(playerId);
    }

    /**
     * Remove a player from the game
     */
    public removePlayer(playerId: PlayerId): void {
        this.gameState.removePlayer(playerId);
    }

    /**
     * Queue an action for a player
     */
    public queueAction(action: GameAction): void {
        if (!this.isRunning) return;
        
        if (this.validateAction(action)) {
            this.gameState.queueAction(action);
        } else {
            this.emit('actionRejected', {
                action,
                reason: 'Invalid action or insufficient resources',
                timestamp: new Date()
            });
        }
    }

    /**
     * Get the current game cycle information
     */
    public getCurrentCycle(): ServerGameCycle {
        return this.gameLoop.getCurrentCycle();
    }

    /**
     * Get the current game phase
     */
    public getCurrentPhase(): GamePhase {
        return this.getCurrentCycle().currentPhase;
    }

    /**
     * Validate a player action
     */
    private validateAction(action: GameAction): boolean {
        // Check if action type is valid for current phase
        const currentPhase = this.getCurrentPhase();
        if (!this.turnManager.isActionAllowed(action.type)) {
            return false;
        }

        // Check if player exists and has enough resources
        const session = this.gameState.getSessionState();
        const player = session.players.get(action.playerId);
        if (!player) return false;

        // Validate resources if action requires them
        if (action.resources) {
            for (const [resource, amount] of Object.entries(action.resources)) {
                if (player.resources[resource] < amount) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Event Handlers
     */
    private handleGameLoopStarted(cycle: ServerGameCycle): void {
        console.log('Game loop started', {
            timestamp: new Date(),
            cycle: cycle.cycleId
        });
    }

    private handleCycleStarted(data: { cycle: ServerGameCycle }): void {
        console.log('New cycle started', {
            cycleId: data.cycle.cycleId,
            timestamp: new Date()
        });
    }

    private handlePhaseStarted(data: { phase: GamePhase, duration: number }): void {
        console.log('Phase started', {
            phase: data.phase,
            duration: data.duration,
            timestamp: new Date()
        });
    }

    private handleGameCompleted(finalCycle: ServerGameCycle): void {
        console.log('Game completed', {
            finalCycle: finalCycle.cycleId,
            timestamp: new Date()
        });
        this.stop();
    }

    private handleActionProcessed(result: { action: GameAction, success: boolean }): void {
        console.log('Action processed', {
            actionId: result.action.id,
            success: result.success,
            timestamp: new Date()
        });
    }

    private handleRewardsDistributed(data: { playerId: PlayerId, rewards: GameRewards }): void {
        console.log('Rewards distributed', {
            playerId: data.playerId,
            rewards: data.rewards,
            timestamp: new Date()
        });
    }

    private handlePlayerJoined(data: { playerId: PlayerId }): void {
        console.log('Player joined', {
            playerId: data.playerId,
            timestamp: new Date()
        });
    }

    private handlePlayerLeft(data: { playerId: PlayerId }): void {
        console.log('Player left', {
            playerId: data.playerId,
            timestamp: new Date()
        });
    }

    private handleWorldStateUpdated(worldState: any): void {
        console.log('World state updated', {
            phase: worldState.phase,
            cycle: worldState.cycle,
            timestamp: new Date()
        });
    }

    /**
     * Helper methods
     */
    public getPlayerState(playerId: PlayerId): any {
        const session = this.gameState.getSessionState();
        return session.players.get(playerId);
    }

    public getWorldState(): any {
        const session = this.gameState.getSessionState();
        return session.worldState;
    }

    public getAIState(): any {
        const session = this.gameState.getSessionState();
        return session.aiState;
    }

    /**
     * Debug and monitoring methods
     */
    public getServiceStatus(): any {
        return {
            isRunning: this.isRunning,
            currentCycle: this.getCurrentCycle(),
            playerCount: this.gameState.getSessionState().players.size,
            queuedActions: this.gameState.getSessionState().actionQueue.length,
            timestamp: new Date()
        };
    }

    public getDebugInfo(): any {
        const session = this.gameState.getSessionState();
        return {
            service: this.getServiceStatus(),
            gameLoop: {
                currentCycle: this.getCurrentCycle(),
                currentPhase: this.getCurrentPhase()
            },
            turnManager: {
                phaseConfig: this.turnManager.getCurrentPhaseConfig()
            },
            gameState: {
                playerCount: session.players.size,
                actionQueueLength: session.actionQueue.length,
                worldState: session.worldState,
                aiState: session.aiState
            }
        };
    }
}

export default GameService;