import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubmitActionDto } from './dto/submit-action.dto';

@Injectable()
export class GameCycleManager {
  private readonly logger = new Logger(GameCycleManager.name);
  private static readonly CYCLE_DURATION = 73.828; // seconds
  private static readonly TOTAL_CYCLES = 8192;

  private currentCycle: number;
  private cycleStartTime: number;
  private actionQueue: Map<string, SubmitActionDto[]>; // gameId -> actions
  private cycleInterval: NodeJS.Timer;

  constructor(private eventEmitter: EventEmitter2) {
    this.currentCycle = 0;
    this.cycleStartTime = Date.now();
    this.actionQueue = new Map();
    this.startCycleTimer();
  }

  private startCycleTimer() {
    // Convert cycle duration to milliseconds
    const cycleDurationMs = GameCycleManager.CYCLE_DURATION * 1000;
    
    this.cycleInterval = setInterval(() => {
      this.processCycleEnd();
    }, cycleDurationMs);

    // Fine-tune the timer to maintain precise 73.828s cycles
    setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.cycleStartTime;
      const expectedElapsed = this.currentCycle * cycleDurationMs;
      const drift = elapsed - expectedElapsed;

      if (Math.abs(drift) > 100) { // Adjust if drift exceeds 100ms
        this.logger.debug(`Cycle drift detected: ${drift}ms. Adjusting...`);
        clearInterval(this.cycleInterval);
        this.startCycleTimer();
      }
    }, 10000); // Check every 10 seconds
  }

  private async processCycleEnd() {
    try {
      this.currentCycle++;
      this.cycleStartTime = Date.now();

      // Emit cycle end event with queued actions
      await this.eventEmitter.emit('cycle.end', {
        cycle: this.currentCycle,
        timestamp: this.cycleStartTime,
        actions: Array.from(this.actionQueue.values()).flat()
      });

      // Clear action queue after processing
      this.actionQueue.clear();

      // Check if we've reached total cycles (8192)
      if (this.currentCycle >= GameCycleManager.TOTAL_CYCLES) {
        await this.eventEmitter.emit('game.end', {
          timestamp: this.cycleStartTime
        });
        this.resetCycle();
      }
    } catch (error) {
      this.logger.error(`Error processing cycle end: ${error.message}`, error.stack);
    }
  }

  private resetCycle() {
    this.currentCycle = 0;
    this.actionQueue.clear();
    this.cycleStartTime = Date.now();
  }

  public getCurrentCycle(): number {
    return this.currentCycle;
  }

  public getTimeUntilNextCycle(): number {
    const now = Date.now();
    const elapsed = (now - this.cycleStartTime) / 1000;
    return Math.max(0, GameCycleManager.CYCLE_DURATION - elapsed);
  }

  public getTotalCycles(): number {
    return GameCycleManager.TOTAL_CYCLES;
  }

  public canSubmitAction(action: SubmitActionDto): boolean {
    // Validate action timing against current cycle
    const timeUntilNext = this.getTimeUntilNextCycle();
    
    // Don't accept actions too close to cycle end (e.g., last 1 second)
    if (timeUntilNext < 1) {
      return false;
    }

    // Add additional validation logic here
    return true;
  }

  public queueAction(action: SubmitActionDto): void {
    const gameId = action.gameId;
    if (!this.actionQueue.has(gameId)) {
      this.actionQueue.set(gameId, []);
    }
    this.actionQueue.get(gameId).push(action);
  }

  public getQueuedActions(): SubmitActionDto[] {
    return Array.from(this.actionQueue.values()).flat();
  }

  public getQueuedActionCount(gameId: string): number {
    return this.actionQueue.get(gameId)?.length || 0;
  }

  public clearQueue(): void {
    this.actionQueue.clear();
  }

  public onDestroy() {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
    }
  }
}