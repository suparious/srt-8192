export interface TutorialStep {
    stepId: string;
    description: string;
    isCompleted: boolean;
  }
  
  export class TutorialService {
    private playerTutorials: Map<string, TutorialStep[]>;
  
    constructor() {
      this.playerTutorials = new Map();
    }
  
    /**
     * Initialize tutorial for a new player
     * @param playerId - Unique identifier for the player
     */
    public initializeTutorial(playerId: string): void {
      if (!this.playerTutorials.has(playerId)) {
        this.playerTutorials.set(playerId, this.getDefaultTutorialSteps());
      }
    }
  
    /**
     * Mark a tutorial step as completed for a player
     * @param playerId - Unique identifier for the player
     * @param stepId - Unique identifier for the tutorial step
     */
    public completeTutorialStep(playerId: string, stepId: string): void {
      const tutorialSteps = this.playerTutorials.get(playerId);
      if (tutorialSteps) {
        const step = tutorialSteps.find(s => s.stepId === stepId);
        if (step && !step.isCompleted) {
          step.isCompleted = true;
        }
      }
    }
  
    /**
     * Get current tutorial steps for a player
     * @param playerId - Unique identifier for the player
     * @returns Array of TutorialStep or undefined if player does not exist
     */
    public getPlayerTutorialSteps(playerId: string): TutorialStep[] | undefined {
      return this.playerTutorials.get(playerId);
    }
  
    /**
     * Check if a player has completed all tutorial steps
     * @param playerId - Unique identifier for the player
     * @returns boolean indicating if all steps are completed
     */
    public isTutorialCompleted(playerId: string): boolean {
      const tutorialSteps = this.playerTutorials.get(playerId);
      return tutorialSteps ? tutorialSteps.every(step => step.isCompleted) : false;
    }
  
    /**
     * Get default tutorial steps for new players
     * @returns Array of TutorialStep representing the default tutorial
     */
    private getDefaultTutorialSteps(): TutorialStep[] {
      return [
        { stepId: '1', description: 'Welcome to the game! Learn the basics.', isCompleted: false },
        { stepId: '2', description: 'Collect your first resource.', isCompleted: false },
        { stepId: '3', description: 'Engage in your first combat.', isCompleted: false },
        { stepId: '4', description: 'Build your first structure.', isCompleted: false }
      ];
    }
  }
  
  // Example usage
  const tutorialService = new TutorialService();
  tutorialService.initializeTutorial('player1');
  tutorialService.completeTutorialStep('player1', '1');
  console.log(tutorialService.getPlayerTutorialSteps('player1'));
  console.log(tutorialService.isTutorialCompleted('player1'));
  