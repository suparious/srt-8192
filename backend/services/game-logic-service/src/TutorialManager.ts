import { TutorialService, TutorialStep } from '../../tutorial-service/src/TutorialService';

export class TutorialManager {
  private tutorialService: TutorialService;

  constructor(tutorialService: TutorialService) {
    this.tutorialService = tutorialService;
  }

  /**
   * Start tutorial for a new player
   * @param playerId - Unique identifier for the player
   */
  public startTutorial(playerId: string): void {
    this.tutorialService.initializeTutorial(playerId);
  }

  /**
   * Progress to the next step in the tutorial
   * @param playerId - Unique identifier for the player
   * @param stepId - Unique identifier for the completed tutorial step
   */
  public progressTutorial(playerId: string, stepId: string): void {
    this.tutorialService.completeTutorialStep(playerId, stepId);
  }

  /**
   * Check if the tutorial is completed for a player
   * @param playerId - Unique identifier for the player
   * @returns boolean indicating if the tutorial is completed
   */
  public isTutorialComplete(playerId: string): boolean {
    return this.tutorialService.isTutorialCompleted(playerId);
  }

  /**
   * Get the current tutorial steps for a player
   * @param playerId - Unique identifier for the player
   * @returns Array of TutorialStep or undefined if player does not exist
   */
  public getTutorialSteps(playerId: string): TutorialStep[] | undefined {
    return this.tutorialService.getPlayerTutorialSteps(playerId);
  }

  /**
   * Restart the tutorial for a player
   * @param playerId - Unique identifier for the player
   */
  public restartTutorial(playerId: string): void {
    this.tutorialService.initializeTutorial(playerId);
  }
}

// Example usage
const tutorialService = new TutorialService();
const tutorialManager = new TutorialManager(tutorialService);

tutorialManager.startTutorial('player1');
tutorialManager.progressTutorial('player1', '1');
console.log(tutorialManager.getTutorialSteps('player1'));
console.log(tutorialManager.isTutorialComplete('player1'));

tutorialManager.restartTutorial('player1');
console.log(tutorialManager.getTutorialSteps('player1'));
