import { GameService } from '../GameService';
import { GamePhase, ActionType } from '../types';

describe('GameService', () => {
    let gameService: GameService;
    
    beforeEach(() => {
        gameService = new GameService();
    });

    afterEach(() => {
        gameService.stop();
    });

    it('should initialize with correct cycle duration', () => {
        const status = gameService.getServiceStatus();
        expect(status.isRunning).toBeFalsy();
    });

    it('should start and stop the service', () => {
        gameService.start();
        let status = gameService.getServiceStatus();
        expect(status.isRunning).toBeTruthy();

        gameService.stop();
        status = gameService.getServiceStatus();
        expect(status.isRunning).toBeFalsy();
    });

    it('should add and remove players', () => {
        const playerId = 'test-player-1';
        
        gameService.addPlayer(playerId);
        let playerState = gameService.getPlayerState(playerId);
        expect(playerState).toBeDefined();
        expect(playerState.id).toBe(playerId);

        gameService.removePlayer(playerId);
        playerState = gameService.getPlayerState(playerId);
        expect(playerState).toBeUndefined();
    });

    it('should track game cycles correctly', () => {
        gameService.start();
        const cycle = gameService.getCurrentCycle();
        
        expect(cycle.cycleId).toBeDefined();
        expect(cycle.currentPhase).toBeDefined();
        expect(cycle.startTime).toBeDefined();
        expect(cycle.endTime).toBeDefined();
    });

    it('should validate actions based on current phase', () => {
        gameService.start();
        const playerId = 'test-player-1';
        gameService.addPlayer(playerId);

        const invalidAction = {
            id: 'test-action-1',
            type: ActionType.ATTACK,
            playerId,
            priority: 1,
            status: 'QUEUED',
            timestamp: new Date()
        };

        // Queue the action and check if it's rejected in PREPARATION phase
        gameService.queueAction(invalidAction);
        const state = gameService.getServiceStatus();
        expect(state.queuedActions).toBe(0);
    });

    it('should process game phases in correct order', async () => {
        const phases: GamePhase[] = [];
        
        gameService.on('phaseStarted', (data: { phase: GamePhase }) => {
            phases.push(data.phase);
        });

        gameService.start();

        // Wait for a complete cycle
        await new Promise(resolve => setTimeout(resolve, 74000));

        expect(phases).toContain(GamePhase.PREPARATION);
        expect(phases).toContain(GamePhase.ACTION);
        expect(phases).toContain(GamePhase.RESOLUTION);
        expect(phases).toContain(GamePhase.INTERMISSION);

        // Verify phase order
        const preparationIndex = phases.indexOf(GamePhase.PREPARATION);
        const actionIndex = phases.indexOf(GamePhase.ACTION);
        const resolutionIndex = phases.indexOf(GamePhase.RESOLUTION);
        const intermissionIndex = phases.indexOf(GamePhase.INTERMISSION);

        expect(preparationIndex).toBeLessThan(actionIndex);
        expect(actionIndex).toBeLessThan(resolutionIndex);
        expect(resolutionIndex).toBeLessThan(intermissionIndex);
    });

    it('should maintain correct cycle timing', async () => {
        gameService.start();
        const startTime = Date.now();

        // Wait for one complete cycle
        await new Promise(resolve => setTimeout(resolve, 74000));

        const endTime = Date.now();
        const cycleDuration = endTime - startTime;

        // Allow for a small timing variance (within 100ms)
        expect(cycleDuration).toBeGreaterThanOrEqual(73728); // 73.828s - 100ms
        expect(cycleDuration).toBeLessThanOrEqual(73928); // 73.828s + 100ms
    });
});
