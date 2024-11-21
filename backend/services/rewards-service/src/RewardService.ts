export interface Reward {
    rewardId: string;
    name: string;
    description: string;
    type: 'cosmetic' | 'functional';
    value: number;
  }
  
  export class RewardService {
    private playerRewards: Map<string, Reward[]>;
  
    constructor() {
      this.playerRewards = new Map();
    }
  
    /**
     * Initialize rewards for a new player
     * @param playerId - Unique identifier for the player
     */
    public initializeRewards(playerId: string): void {
      if (!this.playerRewards.has(playerId)) {
        this.playerRewards.set(playerId, []);
      }
    }
  
    /**
     * Add a reward to a player
     * @param playerId - Unique identifier for the player
     * @param reward - Reward to be added to the player's account
     */
    public addReward(playerId: string, reward: Reward): void {
      const rewards = this.playerRewards.get(playerId);
      if (rewards) {
        rewards.push(reward);
      }
    }
  
    /**
     * Get the rewards of a player
     * @param playerId - Unique identifier for the player
     * @returns Array of Reward or undefined if player does not exist
     */
    public getPlayerRewards(playerId: string): Reward[] | undefined {
      return this.playerRewards.get(playerId);
    }
  
    /**
     * Get all rewards of a specific type for a player
     * @param playerId - Unique identifier for the player
     * @param type - Type of rewards to retrieve ('cosmetic' | 'functional')
     * @returns Array of Reward of the specified type or undefined if player does not exist
     */
    public getRewardsByType(playerId: string, type: 'cosmetic' | 'functional'): Reward[] | undefined {
      const rewards = this.playerRewards.get(playerId);
      if (rewards) {
        return rewards.filter(reward => reward.type === type);
      }
      return undefined;
    }
  }
  
  // Example usage
  const rewardService = new RewardService();
  rewardService.initializeRewards('player1');
  
  const newReward: Reward = {
    rewardId: 'reward1',
    name: 'Golden Skin',
    description: 'A rare cosmetic skin for your units.',
    type: 'cosmetic',
    value: 0,
  };
  
  rewardService.addReward('player1', newReward);
  console.log(rewardService.getPlayerRewards('player1'));
  console.log(rewardService.getRewardsByType('player1', 'cosmetic'));
  