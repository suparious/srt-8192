export class GameConfig {
  // Game cycle configuration
  static readonly CYCLE_DURATION_MS = 73828; // 73.828 seconds
  static readonly MAX_CYCLES = 8192;
  static readonly DAILY_TURNS = 50;
  static readonly MAX_TURNS = 75;

  // Resource configuration
  static readonly INITIAL_RESOURCES = {
    energy: 1000,
    materials: 1000,
    technology: 0,
    intelligence: 0,
    morale: 100
  };

  // Combat configuration
  static readonly COMBAT = {
    BASE_ATTACK_COST: 2,  // turns
    BASE_DEFEND_COST: 1,  // turns
    MIN_ATTACK_STRENGTH: 10,
    MAX_ATTACK_STRENGTH: 100,
    TERRAIN_BONUS_MAX: 0.25  // 25% max terrain bonus
  };

  // Economy configuration
  static readonly ECONOMY = {
    RESOURCE_COLLECTION_COST: 1,  // turns
    TRADE_ACTION_COST: 1,  // turns
    MAX_TRADE_AMOUNT: 1000,
    MARKET_FLUCTUATION_MAX: 0.15  // 15% max price fluctuation
  };

  // Technology configuration
  static readonly TECHNOLOGY = {
    RESEARCH_COST: 3,  // turns
    MAX_TECH_LEVEL: 10,
    TECH_BONUS_PER_LEVEL: 0.05  // 5% bonus per level
  };

  // Diplomatic configuration
  static readonly DIPLOMACY = {
    ALLIANCE_FORMATION_COST: 2,  // turns
    MAX_ALLIANCE_SIZE: 4,
    ALLIANCE_BONUS: 0.1  // 10% bonus for allied actions
  };

  // AI configuration
  static readonly AI = {
    MIN_RESPONSE_TIME_MS: 1000,
    MAX_RESPONSE_TIME_MS: 5000,
    DIFFICULTY_LEVELS: {
      EASY: 0.75,    // AI operates at 75% efficiency
      MEDIUM: 1.0,   // AI operates at 100% efficiency
      HARD: 1.25     // AI operates at 125% efficiency
    }
  };

  // Performance limits
  static readonly LIMITS = {
    MAX_ACTIONS_PER_CYCLE: 1000,
    MAX_PLAYERS_PER_GAME: 8,
    MIN_PLAYERS_PER_GAME: 2,
    MAX_CONCURRENT_GAMES: 100
  };

  // Reward configuration
  static readonly REWARDS = {
    BASE_VICTORY_POINTS: 1000,
    TERRITORY_POINTS: 100,
    RESOURCE_MILESTONE_POINTS: 500,
    ALLIANCE_VICTORY_BONUS: 0.2  // 20% bonus for alliance victories
  };
}
