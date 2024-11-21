// Core game interfaces and types for the 8192 Leadership Simulator

/** Resource types available in the game */
export enum ResourceType {
    ENERGY = 'energy',
    MATERIALS = 'materials',
    TECHNOLOGY = 'technology',
    INTELLIGENCE = 'intelligence',
    MORALE = 'morale',
  }
  
  /** Leadership skill categories */
  export enum LeadershipSkill {
    STRATEGY = 'strategy',
    DIPLOMACY = 'diplomacy',
    ECONOMICS = 'economics',
    MILITARY = 'military',
    RESEARCH = 'research',
  }
  
  /** Game region status */
  export enum RegionStatus {
    CONTROLLED = 'controlled',
    CONTESTED = 'contested',
    ENEMY_CONTROLLED = 'enemy_controlled',
    NEUTRAL = 'neutral',
    WASTELAND = 'wasteland',
  }
  
  /** Basic coordinate type */
  export interface Coordinate {
    x: number;
    y: number;
  }
  
  /** Resource amounts for various game mechanics */
  export interface Resources {
    [ResourceType.ENERGY]: number;
    [ResourceType.MATERIALS]: number;
    [ResourceType.TECHNOLOGY]: number;
    [ResourceType.INTELLIGENCE]: number;
    [ResourceType.MORALE]: number;
  }
  
  /** Leadership abilities and their levels */
  export interface LeadershipStats {
    [LeadershipSkill.STRATEGY]: number;
    [LeadershipSkill.DIPLOMACY]: number;
    [LeadershipSkill.ECONOMICS]: number;
    [LeadershipSkill.MILITARY]: number;
    [LeadershipSkill.RESEARCH]: number;
  }
  
  /** Region on the game map */
  export interface Region {
    id: string;
    name: string;
    coordinates: Coordinate;
    status: RegionStatus;
    resources: Resources;
    population: number;
    defenseLevel: number;
    productionCapacity: number;
    controllingPlayer?: string;
  }
  
  /** Military unit in the game */
  export interface MilitaryUnit {
    id: string;
    type: string;
    strength: number;
    mobility: number;
    position: Coordinate;
    status: 'ready' | 'moving' | 'engaged' | 'recovering';
    health: number;
    experience: number;
  }
  
  /** Player profile and stats */
  export interface Player {
    id: string;
    username: string;
    level: number;
    experience: number;
    resources: Resources;
    leadershipStats: LeadershipStats;
    controlledRegions: string[];
    militaryUnits: MilitaryUnit[];
    researches: string[];
    allies: string[];
    reputation: number;
  }
  
  /** Game cycle information */
  export interface GameCycle {
    current: number;
    total: number; // Always 8192
    phase: 'preparation' | 'action' | 'resolution';
    timeRemaining: number;
  }
  
  /** Weather and environmental conditions */
  export interface EnvironmentalConditions {
    weather: 'clear' | 'stormy' | 'harsh';
    stability: number;
    threatLevel: number;
    aiAggressionLevel: number;
  }
  
  /** Action that can be taken during a turn */
  export interface GameAction {
    id: string;
    type: 'military' | 'economic' | 'diplomatic' | 'research';
    source: string;
    target: string | Coordinate;
    resources?: Partial<Resources>;
    units?: string[];
    timestamp: number;
  }
  
  /** Research project */
  export interface Research {
    id: string;
    name: string;
    description: string;
    cost: Partial<Resources>;
    duration: number;
    prerequisites: string[];
    benefits: {
      resourceBonus?: Partial<Resources>;
      skillBonus?: Partial<LeadershipStats>;
      unlocks?: string[];
    };
  }
  
  /** Game state snapshot */
  export interface GameState {
    cycle: GameCycle;
    players: { [key: string]: Player };
    regions: { [key: string]: Region };
    environment: EnvironmentalConditions;
    activeActions: GameAction[];
    aiThreat: number;
    globalResources: Resources;
    availableResearch: Research[];
  }
  
  /** Game settings and configuration */
  export interface GameConfig {
    mapSize: { width: number; height: number };
    startingResources: Resources;
    cycleLength: number; // in seconds
    maxPlayers: number;
    difficultyLevel: 'normal' | 'hard' | 'extreme';
    aiDifficulty: number;
    enabledFeatures: string[];
  }
  
  /** Update event from the server */
  export interface GameStateUpdate {
    type: 'full' | 'partial';
    timestamp: number;
    changes: Partial<GameState>;
    affectedPlayers: string[];
  }
  
  /** Player action result */
  export interface ActionResult {
    success: boolean;
    actionId: string;
    changes: {
      resources?: Partial<Resources>;
      regions?: string[];
      units?: string[];
      stats?: Partial<LeadershipStats>;
    };
    messages: string[];
  }
  
  /** Permanent rewards earned after a game cycle */
  export interface CycleRewards {
    experience: number;
    coins: number;
    badges: string[];
    skins?: string[];
    perks?: string[];
  }