/**
 * Error codes and messages for 8192 game systems
 */

export enum ErrorCategory {
    AUTHENTICATION = 'AUTH',
    AUTHORIZATION = 'PERM',
    VALIDATION = 'VAL',
    RESOURCE = 'RES',
    COMBAT = 'CBT',
    GAME_STATE = 'STATE',
    PLAYER = 'PLR',
    REGION = 'REG',
    NETWORK = 'NET',
    DATABASE = 'DB',
    SYSTEM = 'SYS',
    AI = 'AI'
  }
  
  export interface ErrorDefinition {
    code: string;
    message: string;
    httpStatus: number;
    level: 'ERROR' | 'WARNING' | 'CRITICAL';
  }
  
  export const ERROR_CODES: { [key: string]: ErrorDefinition } = {
    // Authentication Errors (1000-1099)
    'AUTH_INVALID_CREDENTIALS': {
      code: `${ErrorCategory.AUTHENTICATION}_1000`,
      message: 'Invalid credentials provided',
      httpStatus: 401,
      level: 'ERROR'
    },
    'AUTH_TOKEN_EXPIRED': {
      code: `${ErrorCategory.AUTHENTICATION}_1001`,
      message: 'Authentication token has expired',
      httpStatus: 401,
      level: 'ERROR'
    },
    'AUTH_TOKEN_INVALID': {
      code: `${ErrorCategory.AUTHENTICATION}_1002`,
      message: 'Invalid authentication token',
      httpStatus: 401,
      level: 'ERROR'
    },
    'AUTH_SESSION_EXPIRED': {
      code: `${ErrorCategory.AUTHENTICATION}_1003`,
      message: 'Session has expired',
      httpStatus: 401,
      level: 'ERROR'
    },
  
    // Authorization Errors (1100-1199)
    'PERM_INSUFFICIENT': {
      code: `${ErrorCategory.AUTHORIZATION}_1100`,
      message: 'Insufficient permissions for this action',
      httpStatus: 403,
      level: 'ERROR'
    },
    'PERM_REGION_ACCESS': {
      code: `${ErrorCategory.AUTHORIZATION}_1101`,
      message: 'No access to this region',
      httpStatus: 403,
      level: 'ERROR'
    },
    'PERM_RESOURCE_ACCESS': {
      code: `${ErrorCategory.AUTHORIZATION}_1102`,
      message: 'No access to this resource',
      httpStatus: 403,
      level: 'ERROR'
    },
  
    // Validation Errors (1200-1299)
    'VAL_INVALID_INPUT': {
      code: `${ErrorCategory.VALIDATION}_1200`,
      message: 'Invalid input provided',
      httpStatus: 400,
      level: 'ERROR'
    },
    'VAL_INVALID_ACTION': {
      code: `${ErrorCategory.VALIDATION}_1201`,
      message: 'Invalid action for current game phase',
      httpStatus: 400,
      level: 'ERROR'
    },
    'VAL_INVALID_TARGET': {
      code: `${ErrorCategory.VALIDATION}_1202`,
      message: 'Invalid target for action',
      httpStatus: 400,
      level: 'ERROR'
    },
  
    // Resource Errors (1300-1399)
    'RES_INSUFFICIENT': {
      code: `${ErrorCategory.RESOURCE}_1300`,
      message: 'Insufficient resources',
      httpStatus: 400,
      level: 'ERROR'
    },
    'RES_STORAGE_FULL': {
      code: `${ErrorCategory.RESOURCE}_1301`,
      message: 'Resource storage is full',
      httpStatus: 400,
      level: 'ERROR'
    },
    'RES_TRANSFER_LIMIT': {
      code: `${ErrorCategory.RESOURCE}_1302`,
      message: 'Resource transfer limit exceeded',
      httpStatus: 400,
      level: 'ERROR'
    },
    'RES_CONVERSION_INVALID': {
      code: `${ErrorCategory.RESOURCE}_1303`,
      message: 'Invalid resource conversion',
      httpStatus: 400,
      level: 'ERROR'
    },
  
    // Combat Errors (1400-1499)
    'CBT_INVALID_UNIT': {
      code: `${ErrorCategory.COMBAT}_1400`,
      message: 'Invalid unit for combat',
      httpStatus: 400,
      level: 'ERROR'
    },
    'CBT_UNIT_EXHAUSTED': {
      code: `${ErrorCategory.COMBAT}_1401`,
      message: 'Unit is exhausted',
      httpStatus: 400,
      level: 'ERROR'
    },
    'CBT_INVALID_FORMATION': {
      code: `${ErrorCategory.COMBAT}_1402`,
      message: 'Invalid combat formation',
      httpStatus: 400,
      level: 'ERROR'
    },
    'CBT_OUT_OF_RANGE': {
      code: `${ErrorCategory.COMBAT}_1403`,
      message: 'Target is out of range',
      httpStatus: 400,
      level: 'ERROR'
    },
  
    // Game State Errors (1500-1599)
    'STATE_INVALID_PHASE': {
      code: `${ErrorCategory.GAME_STATE}_1500`,
      message: 'Invalid game phase for action',
      httpStatus: 400,
      level: 'ERROR'
    },
    'STATE_CYCLE_COMPLETE': {
      code: `${ErrorCategory.GAME_STATE}_1501`,
      message: 'Game cycle is complete',
      httpStatus: 400,
      level: 'ERROR'
    },
    'STATE_SYNCHRONIZATION': {
      code: `${ErrorCategory.GAME_STATE}_1502`,
      message: 'Game state synchronization error',
      httpStatus: 500,
      level: 'CRITICAL'
    },
  
    // Player Errors (1600-1699)
    'PLR_NOT_FOUND': {
      code: `${ErrorCategory.PLAYER}_1600`,
      message: 'Player not found',
      httpStatus: 404,
      level: 'ERROR'
    },
    'PLR_ALREADY_EXISTS': {
      code: `${ErrorCategory.PLAYER}_1601`,
      message: 'Player already exists',
      httpStatus: 409,
      level: 'ERROR'
    },
    'PLR_MAX_ACTIONS': {
      code: `${ErrorCategory.PLAYER}_1602`,
      message: 'Maximum actions reached for this phase',
      httpStatus: 400,
      level: 'ERROR'
    },
  
    // Region Errors (1700-1799)
    'REG_NOT_FOUND': {
      code: `${ErrorCategory.REGION}_1700`,
      message: 'Region not found',
      httpStatus: 404,
      level: 'ERROR'
    },
    'REG_NOT_ADJACENT': {
      code: `${ErrorCategory.REGION}_1701`,
      message: 'Regions are not adjacent',
      httpStatus: 400,
      level: 'ERROR'
    },
    'REG_CONTESTED': {
      code: `${ErrorCategory.REGION}_1702`,
      message: 'Region is contested',
      httpStatus: 400,
      level: 'ERROR'
    },
  
    // Network Errors (1800-1899)
    'NET_CONNECTION_LOST': {
      code: `${ErrorCategory.NETWORK}_1800`,
      message: 'Connection lost',
      httpStatus: 503,
      level: 'WARNING'
    },
    'NET_TIMEOUT': {
      code: `${ErrorCategory.NETWORK}_1801`,
      message: 'Network timeout',
      httpStatus: 504,
      level: 'WARNING'
    },
    'NET_SERVICE_UNAVAILABLE': {
      code: `${ErrorCategory.NETWORK}_1802`,
      message: 'Service temporarily unavailable',
      httpStatus: 503,
      level: 'CRITICAL'
    },
  
    // Database Errors (1900-1999)
    'DB_CONNECTION': {
      code: `${ErrorCategory.DATABASE}_1900`,
      message: 'Database connection error',
      httpStatus: 503,
      level: 'CRITICAL'
    },
    'DB_QUERY': {
      code: `${ErrorCategory.DATABASE}_1901`,
      message: 'Database query error',
      httpStatus: 500,
      level: 'ERROR'
    },
    'DB_INTEGRITY': {
      code: `${ErrorCategory.DATABASE}_1902`,
      message: 'Database integrity error',
      httpStatus: 500,
      level: 'CRITICAL'
    },
  
    // System Errors (2000-2099)
    'SYS_INTERNAL': {
      code: `${ErrorCategory.SYSTEM}_2000`,
      message: 'Internal system error',
      httpStatus: 500,
      level: 'CRITICAL'
    },
    'SYS_MAINTENANCE': {
      code: `${ErrorCategory.SYSTEM}_2001`,
      message: 'System under maintenance',
      httpStatus: 503,
      level: 'WARNING'
    },
    'SYS_RATE_LIMIT': {
      code: `${ErrorCategory.SYSTEM}_2002`,
      message: 'Rate limit exceeded',
      httpStatus: 429,
      level: 'WARNING'
    },
  
    // AI Errors (2100-2199)
    'AI_PROCESSING': {
      code: `${ErrorCategory.AI}_2100`,
      message: 'AI processing error',
      httpStatus: 500,
      level: 'ERROR'
    },
    'AI_MODEL_LOAD': {
      code: `${ErrorCategory.AI}_2101`,
      message: 'AI model loading error',
      httpStatus: 500,
      level: 'CRITICAL'
    },
    'AI_RESPONSE_TIMEOUT': {
      code: `${ErrorCategory.AI}_2102`,
      message: 'AI response timeout',
      httpStatus: 504,
      level: 'ERROR'
    }
  } as const;
  
  /**
   * Create a game error with the specified error code
   */
  export class GameError extends Error {
    public readonly code: string;
    public readonly httpStatus: number;
    public readonly level: string;
  
    constructor(errorCode: keyof typeof ERROR_CODES, details?: string) {
      const errorDef = ERROR_CODES[errorCode];
      const message = details ? `${errorDef.message}: ${details}` : errorDef.message;
      super(message);
      
      this.code = errorDef.code;
      this.httpStatus = errorDef.httpStatus;
      this.level = errorDef.level;
      this.name = 'GameError';
    }
  }
  
  /**
   * Helper function to create a game error
   */
  export function createError(code: keyof typeof ERROR_CODES, details?: string): GameError {
    return new GameError(code, details);
  }
  
  // Usage example:
  // throw createError('RES_INSUFFICIENT', 'Need 100 more energy');