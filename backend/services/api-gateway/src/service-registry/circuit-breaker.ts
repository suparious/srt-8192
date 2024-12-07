export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private failures: number;
  private lastFailureTime: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';

  constructor(failureThreshold = 5, resetTimeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Check if enough time has passed to try half-open state
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  trip(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState(): string {
    return this.state;
  }
}