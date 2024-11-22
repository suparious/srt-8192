// backend/services/game-logic-service/src/ai/AIController.ts
import { EventEmitter } from 'events';
import { BehaviorModel } from './BehaviorSystem';
import {
    GameState,
    PlayerId,
    ActionType,
    QueuedAction,
    ResourceCost,
    AIActivityMetrics,
    WorldEventType,
    RegionId,
    ServerRegion,
    UnitType
} from '../types';

interface AIPersonality {
    aggression: number;    // Tendency to attack (0-1)
    expansion: number;     // Tendency to capture new regions (0-1)
    technology: number;    // Focus on research and development (0-1)
    diplomacy: number;     // Likelihood to form alliances (0-1)
    economics: number;     // Focus on resource management (0-1)
    adaptation: number;    // Ability to change strategy (0-1)
}

interface AIStrategy {
    primaryFocus: ActionType;
    secondaryFocus: ActionType;
    targetRegions: RegionId[];
    resourcePriorities: Partial<ResourceCost>;
    unitPreferences: UnitType[];
}

export class AIController extends EventEmitter {
    private personality: AIPersonality;
    private currentStrategy: AIStrategy;
    private behaviorModel: BehaviorModel;
    private lastActionTime: number;
    private readonly actionCooldown: number = 5000; // 5 seconds between actions

    constructor(
        private readonly playerId: PlayerId,
        initialPersonality?: Partial<AIPersonality>
    ) {
        super();
        this.personality = this.initializePersonality(initialPersonality);
        this.behaviorModel = new BehaviorModel(this.personality);
        this.currentStrategy = this.generateInitialStrategy();
        this.lastActionTime = Date.now();
    }

    /**
     * Initialize AI personality with defaults or provided values
     */
    private initializePersonality(partial?: Partial<AIPersonality>): AIPersonality {
        return {
            aggression: partial?.aggression ?? 0.5,
            expansion: partial?.expansion ?? 0.5,
            technology: partial?.technology ?? 0.5,
            diplomacy: partial?.diplomacy ?? 0.5,
            economics: partial?.economics ?? 0.5,
            adaptation: partial?.adaptation ?? 0.5
        };
    }

    /**
     * Generate initial AI strategy based on personality
     */
    private generateInitialStrategy(): AIStrategy {
        const { aggression, expansion, technology, economics } = this.personality;

        // Determine primary focus based on highest personality trait
        const traits = [
            { type: ActionType.ATTACK, value: aggression },
            { type: ActionType.MOVE, value: expansion },
            { type: ActionType.RESEARCH, value: technology },
            { type: ActionType.ECONOMIC, value: economics }
        ];

        const [primary, secondary] = traits
            .sort((a, b) => b.value - a.value)
            .map(t => t.type);

        return {
            primaryFocus: primary,
            secondaryFocus: secondary,
            targetRegions: [],
            resourcePriorities: this.calculateResourcePriorities(),
            unitPreferences: this.determineUnitPreferences()
        };
    }

    /**
     * Calculate resource priorities based on personality and strategy
     */
    private calculateResourcePriorities(): Partial<ResourceCost> {
        const priorities: Partial<ResourceCost> = {};

        // Adjust priorities based on personality
        if (this.personality.technology > 0.6) {
            priorities.technology = 1;
        }
        if (this.personality.aggression > 0.6) {
            priorities.energy = 1;
            priorities.materials = 0.8;
        }
        if (this.personality.economics > 0.6) {
            priorities.materials = 1;
            priorities.intelligence = 0.8;
        }

        return priorities;
    }

    /**
     * Determine unit preferences based on personality
     */
    private determineUnitPreferences(): UnitType[] {
        const preferences: UnitType[] = [];

        if (this.personality.aggression > 0.7) {
            preferences.push(UnitType.MECHANIZED, UnitType.AERIAL);
        } else if (this.personality.defense > 0.7) {
            preferences.push(UnitType.INFANTRY, UnitType.SPECIAL);
        } else {
            preferences.push(UnitType.NAVAL, UnitType.AERIAL);
        }

        return preferences;
    }

    /**
     * Generate next AI action based on current state and strategy
     */
    public generateAction(gameState: GameState): QueuedAction | null {
        const now = Date.now();
        if (now - this.lastActionTime < this.actionCooldown) {
            return null;
        }

        // Update behavior model with current state
        this.behaviorModel.updateFromAction(gameState);

        // Get behavior prediction
        const prediction = this.behaviorModel.predictBehavior(
            gameState,
            gameState.getCurrentPhase()
        );

        // Generate action based on prediction and personality
        const action = this.createActionFromPrediction(prediction, gameState);
        if (action) {
            this.lastActionTime = now;
            this.emit('actionGenerated', action);
        }

        return action;
    }

    /**
     * Create concrete action from behavior prediction
     */
    private createActionFromPrediction(
        prediction: any,
        gameState: GameState
    ): QueuedAction | null {
        const ownState = gameState.getPlayerState(this.playerId);
        const ownRegions = gameState.getControlledRegions(this.playerId);

        // Calculate action weights based on personality and current state
        const actionWeights = {
            [ActionType.ATTACK]: this.personality.aggression * this.calculateAttackWeight(gameState),
            [ActionType.MOVE]: this.personality.expansion * this.calculateMoveWeight(gameState),
            [ActionType.RESEARCH]: this.personality.technology * this.calculateResearchWeight(gameState),
            [ActionType.ECONOMIC]: this.personality.economics * this.calculateEconomicWeight(gameState),
            [ActionType.DIPLOMATIC]: this.personality.diplomacy * this.calculateDiplomaticWeight(gameState)
        };

        // Select action type with highest weight
        const selectedActionType = Object.entries(actionWeights)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0] as ActionType;

        // Generate specific action based on type
        switch (selectedActionType) {
            case ActionType.ATTACK:
                return this.generateAttackAction(gameState);
            case ActionType.MOVE:
                return this.generateMoveAction(gameState);
            case ActionType.RESEARCH:
                return this.generateResearchAction(gameState);
            case ActionType.ECONOMIC:
                return this.generateEconomicAction(gameState);
            case ActionType.DIPLOMATIC:
                return this.generateDiplomaticAction(gameState);
            default:
                return null;
        }
    }

    private calculateAttackWeight(gameState: GameState): number {
        const ownStrength = this.calculateMilitaryStrength(gameState, this.playerId);
        const nearestEnemyStrength = this.findNearestEnemyStrength(gameState);
        const resourceSecurity = this.calculateResourceSecurity(gameState);

        return (ownStrength / nearestEnemyStrength) * (1 + resourceSecurity);
    }

    private calculateMoveWeight(gameState: GameState): number {
        const uncontrolledNeighbors = this.getUncontrolledNeighborRegions(gameState);
        const expansionOpportunities = uncontrolledNeighbors.length;
        const currentTerritory = gameState.getControlledRegions(this.playerId).length;

        return (expansionOpportunities / currentTerritory) * this.personality.expansion;
    }

    private calculateResearchWeight(gameState: GameState): number {
        const currentTechLevel = gameState.getPlayerState(this.playerId).technologyLevel;
        const maxTechLevel = gameState.getMaxTechnologyLevel();
        const resourceAvailability = this.calculateResourceAvailability(gameState);

        return ((maxTechLevel - currentTechLevel) / maxTechLevel) * resourceAvailability;
    }

    private calculateEconomicWeight(gameState: GameState): number {
        const resourceStatus = this.analyzeResourceStatus(gameState);
        const marketOpportunities = this.analyzeMarketOpportunities(gameState);

        return (1 - resourceStatus) * marketOpportunities;
    }

    private calculateDiplomaticWeight(gameState: GameState): number {
        const currentAllies = gameState.getAlliances(this.playerId).length;
        const potentialAllies = this.findPotentialAllies(gameState).length;
        const threatLevel = this.analyzeThreatLevel(gameState);

        return (potentialAllies / (currentAllies + 1)) * threatLevel;
    }

    private generateAttackAction(gameState: GameState): QueuedAction {
        const targetRegion = this.selectBestAttackTarget(gameState);
        const availableUnits = this.getAvailableUnits(gameState);
        const attackForce = this.calculateOptimalAttackForce(availableUnits, targetRegion);

        return {
            type: ActionType.ATTACK,
            playerId: this.playerId,
            targetRegionId: targetRegion.id,
            units: attackForce,
            timestamp: Date.now(),
            priority: this.personality.aggression
        };
    }

    private generateMoveAction(gameState: GameState): QueuedAction {
        const targetRegion = this.selectBestExpansionTarget(gameState);
        const availableUnits = this.getAvailableUnits(gameState);
        const moveForce = this.calculateOptimalMoveForce(availableUnits);

        return {
            type: ActionType.MOVE,
            playerId: this.playerId,
            targetRegionId: targetRegion.id,
            units: moveForce,
            timestamp: Date.now(),
            priority: this.personality.expansion
        };
    }

    private generateResearchAction(gameState: GameState): QueuedAction {
        const currentTech = gameState.getPlayerState(this.playerId).technologyLevel;
        const bestTechOption = this.selectBestTechnologyOption(currentTech);

        return {
            type: ActionType.RESEARCH,
            playerId: this.playerId,
            technologyType: bestTechOption,
            resourceCommitment: this.calculateResearchCommitment(gameState),
            timestamp: Date.now(),
            priority: this.personality.technology
        };
    }

    private analyzeThreatLevel(gameState: GameState): number {
        const ownStrength = this.calculateMilitaryStrength(gameState, this.playerId);
        const nearbyThreats = this.findNearbyThreats(gameState);
        const borderVulnerability = this.calculateBorderVulnerability(gameState);

        return (nearbyThreats / ownStrength) * borderVulnerability;
    }

    private analyzeResourceStatus(gameState: GameState): number {
        const playerResources = gameState.getPlayerState(this.playerId).resources;
        const maxResources = gameState.getMaxResources();

        return Object.entries(playerResources).reduce((acc, [resource, amount]) => {
            return acc + (amount / maxResources[resource]);
        }, 0) / Object.keys(playerResources).length;
    }

    private analyzeMarketOpportunities(gameState: GameState): number {
        const marketPrices = gameState.getMarketPrices();
        const playerResources = gameState.getPlayerState(this.playerId).resources;
        let opportunityScore = 0;

        for (const [resource, price] of Object.entries(marketPrices)) {
            const averagePrice = gameState.getAverageMarketPrice(resource);
            const priceRatio = price / averagePrice;

            if (priceRatio > 1.2 && playerResources[resource] > 0) {
                // Selling opportunity
                opportunityScore += 0.2;
            } else if (priceRatio < 0.8) {
                // Buying opportunity
                opportunityScore += 0.15;
            }
        }

        return Math.min(opportunityScore, 1);
    }

    private findPotentialAllies(gameState: GameState): PlayerId[] {
        const allPlayers = gameState.getAllPlayers();
        const currentAllies = gameState.getAlliances(this.playerId);

        return allPlayers.filter(playerId => {
            if (playerId === this.playerId || currentAllies.includes(playerId)) {
                return false;
            }

            const relationshipScore = this.calculateRelationshipScore(gameState, playerId);
            return relationshipScore > 0.6; // Threshold for potential alliance
        });
    }

    private calculateRelationshipScore(gameState: GameState, otherPlayerId: PlayerId): number {
        const tradeHistory = gameState.getTradeHistory(this.playerId, otherPlayerId);
        const conflictHistory = gameState.getConflictHistory(this.playerId, otherPlayerId);
        const commonEnemies = this.findCommonEnemies(gameState, otherPlayerId);

        return (
            (tradeHistory.positiveInteractions * 0.4) +
            (1 - conflictHistory.negativeInteractions * 0.4) +
            (commonEnemies.length * 0.2)
        );
    }

    /**
     * Update AI strategy based on game state
     */
    public updateStrategy(gameState: GameState): void {
        const adaptationRate = this.personality.adaptation;

        // Analyze current situation
        const threatLevel = this.analyzeThreatLevel(gameState);
        const resourceStatus = this.analyzeResourceStatus(gameState);

        // Adjust strategy based on situation and personality
        if (threatLevel > 0.7 && this.personality.aggression > 0.5) {
            this.currentStrategy.primaryFocus = ActionType.ATTACK;
        } else if (resourceStatus < 0.3 && this.personality.economics > 0.5) {
            this.currentStrategy.primaryFocus = ActionType.ECONOMIC;
        }

        this.emit('strategyUpdated', this.currentStrategy);
    }

    /**
     * Analyze threat level from game state
     */
    private analyzeThreatLevel(gameState: GameState): number {
        // Implementation would analyze various threat factors
        return 0.5; // Placeholder
    }

    /**
     * Analyze resource status from game state
     */
    private analyzeResourceStatus(gameState: GameState): number {
        // Implementation would analyze resource levels and trends
        return 0.5; // Placeholder
    }

    /**
     * Handle world events that affect AI behavior
     */
    public handleWorldEvent(eventType: WorldEventType): void {
        switch (eventType) {
            case WorldEventType.NATURAL_DISASTER:
                this.personality.economics += this.learningRate;
                this.personality.expansion -= this.learningRate;
                break;
            case WorldEventType.ECONOMIC_CRISIS:
                this.personality.economics += this.learningRate * 2;
                this.personality.aggression -= this.learningRate;
                break;
            // Add other event handlers
        }

        // Normalize personality traits
        this.normalizePersonality();
        this.emit('personalityUpdated', this.personality);
    }

    /**
     * Normalize personality traits to ensure they stay within 0-1 range
     */
    private normalizePersonality(): void {
        Object.keys(this.personality).forEach(trait => {
            this.personality[trait] = Math.max(0, Math.min(1, this.personality[trait]));
        });
    }

    /**
     * Get current AI metrics
     */
    public getMetrics(): AIActivityMetrics {
        return {
            aggressionLevel: this.personality.aggression,
            expansionRate: this.personality.expansion,
            techProgress: this.personality.technology,
            targetedRegions: this.currentStrategy.targetRegions,
            predictedNextActions: this.behaviorModel.getActionPredictions()
        };
    }

    /**
     * Save AI state
     */
    public saveState(): string {
        return JSON.stringify({
            personality: this.personality,
            currentStrategy: this.currentStrategy,
            behaviorModel: this.behaviorModel.serializeState()
        });
    }

    /**
     * Load AI state
     */
    public loadState(serializedState: string): void {
        try {
            const state = JSON.parse(serializedState);
            this.personality = state.personality;
            this.currentStrategy = state.currentStrategy;
            this.behaviorModel.loadState(state.behaviorModel);
            this.emit('stateLoaded', this.getMetrics());
        } catch (error) {
            throw new Error('Failed to load AI state');
        }
    }
}

export class GlobalStrategyLearning {
    private globalPlayerStrategies: Map<string, PlayerStrategy>;

    public learnFromGlobalBehavior(gameState: GameState): void {
        // Implement global strategy learning
    }
}