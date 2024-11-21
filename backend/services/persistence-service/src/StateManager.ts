import fs from 'fs';
import path from 'path';

interface GameState {
  cycleId: number;
  players: Record<string, PlayerState>;
  worldState: WorldState;
}

interface PlayerState {
  id: string;
  resources: Record<string, number>;
  regions: string[];
}

interface WorldState {
  globalStability: number;
  aiActivity: Record<string, number>;
}

class StateManager {
  private stateFilePath: string;
  private autosaveInterval: number;
  private autosaveTimer: NodeJS.Timeout | null;

  constructor(stateFileName: string = 'game_state.json', autosaveInterval: number = 600) {
    this.stateFilePath = path.join(__dirname, stateFileName);
    this.autosaveInterval = autosaveInterval * 1000; // Convert seconds to milliseconds
    this.autosaveTimer = null;
    this.startAutosave();
  }

  /**
   * Load the game state from a file.
   */
  public loadState(): GameState | null {
    try {
      const data = fs.readFileSync(this.stateFilePath, 'utf-8');
      return JSON.parse(data) as GameState;
    } catch (err) {
      console.error('Error loading game state:', err);
      return null;
    }
  }

  /**
   * Save the current game state to a file.
   */
  public saveState(state: GameState): void {
    try {
      const data = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.stateFilePath, data, 'utf-8');
    } catch (err) {
      console.error('Error saving game state:', err);
    }
  }

  /**
   * Update the game state and persist it to the file.
   */
  public updateState(updateFn: (state: GameState) => GameState): void {
    const currentState = this.loadState();
    if (currentState) {
      const newState = updateFn(currentState);
      this.saveState(newState);
    } else {
      console.error('Unable to update state. No valid state found.');
    }
  }

  /**
   * Start the autosave timer.
   */
  private startAutosave(): void {
    this.autosaveTimer = setInterval(() => {
      const currentState = this.loadState();
      if (currentState) {
        this.saveState(currentState);
        console.log('Autosave completed at', new Date().toISOString());
      }
    }, this.autosaveInterval);
  }

  /**
   * Stop the autosave timer.
   */
  public stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
      console.log('Autosave stopped.');
    }
  }

  /**
   * Rollback to a previous saved state.
   */
  public rollbackState(backupFileName: string = 'game_state_backup.json'): void {
    const backupFilePath = path.join(__dirname, backupFileName);
    try {
      const backupData = fs.readFileSync(backupFilePath, 'utf-8');
      const backupState = JSON.parse(backupData) as GameState;
      this.saveState(backupState);
      console.log('Rollback completed successfully.');
    } catch (err) {
      console.error('Error rolling back game state:', err);
    }
  }

  /**
   * Create a backup of the current game state.
   */
  public createBackup(backupFileName: string = 'game_state_backup.json'): void {
    const currentState = this.loadState();
    if (currentState) {
      try {
        const backupFilePath = path.join(__dirname, backupFileName);
        const data = JSON.stringify(currentState, null, 2);
        fs.writeFileSync(backupFilePath, data, 'utf-8');
        console.log('Backup created successfully at', new Date().toISOString());
      } catch (err) {
        console.error('Error creating backup:', err);
      }
    } else {
      console.error('Unable to create backup. No valid state found.');
    }
  }
}

// Example usage
const stateManager = new StateManager();
const currentState = stateManager.loadState();
if (currentState) {
  console.log('Loaded Game State:', currentState);
}

export { StateManager, GameState, PlayerState, WorldState };
