import { GameState, StateManager } from './StateManager';
import { EventEmitter } from 'events';

interface SyncServiceConfig {
  syncInterval: number; // in milliseconds
}

class StateSyncService extends EventEmitter {
  private stateManager: StateManager;
  private syncInterval: number;
  private syncTimer: NodeJS.Timeout | null;

  constructor(stateManager: StateManager, config: SyncServiceConfig) {
    super();
    this.stateManager = stateManager;
    this.syncInterval = config.syncInterval;
    this.syncTimer = null;
    this.startSync();
  }

  /**
   * Start the state synchronization process.
   */
  private startSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncState();
    }, this.syncInterval);
  }

  /**
   * Stop the state synchronization process.
   */
  public stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('State synchronization stopped.');
    }
  }

  /**
   * Synchronize the current game state.
   */
  private syncState(): void {
    const currentState = this.stateManager.loadState();
    if (currentState) {
      this.emit('sync', currentState);
      console.log('State synchronized at', new Date().toISOString());
    } else {
      console.error('Unable to synchronize state. No valid state found.');
    }
  }

  /**
   * Trigger a manual state synchronization.
   */
  public manualSync(): void {
    this.syncState();
  }
}

// Example usage
const stateManager = new StateManager();
const syncService = new StateSyncService(stateManager, { syncInterval: 60000 });
syncService.on('sync', (state: GameState) => {
  console.log('Synchronized State:', state);
});

export { StateSyncService, SyncServiceConfig };
