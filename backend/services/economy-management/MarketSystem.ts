import { EventEmitter } from 'events';
import {
  ResourceType,
  ResourceCost,
  PlayerId,
  TradeOffer,
  MarketState,
  TradeResult,
  PriceHistory,
  MarketTransaction,
  WorldState
} from '../types';

export class MarketSystem extends EventEmitter {
  private marketState: MarketState;
  private priceHistory: Map<ResourceType, PriceHistory[]>;
  private activeOffers: Map<string, TradeOffer>;
  private priceFluctuations: Map<ResourceType, number>;
  private tradeHistory: TradeTransaction[];
  private readonly volatilityFactor: number = 0.1;
  private readonly maxPriceHistory: number = 100;
  private readonly baselinePrices: Record<ResourceType, number> = {
    [ResourceType.ENERGY]: 100,
    [ResourceType.MATERIALS]: 150,
    [ResourceType.TECHNOLOGY]: 200,
    [ResourceType.INTELLIGENCE]: 250,
    [ResourceType.MORALE]: 175
  };

  constructor() {
    super();
    this.marketState = this.initializeMarketState();
    this.priceHistory = new Map();
    this.activeOffers = new Map();
    this.initializePriceHistory();
  }

  /**
   * Initialize market state with default values
   */
  private initializeMarketState(): MarketState {
    return {
      currentPrices: { ...this.baselinePrices },
      volatility: {
        [ResourceType.ENERGY]: 0.1,
        [ResourceType.MATERIALS]: 0.15,
        [ResourceType.TECHNOLOGY]: 0.2,
        [ResourceType.INTELLIGENCE]: 0.25,
        [ResourceType.MORALE]: 0.12
      },
      tradingVolume: new Map(),
      lastUpdate: new Date()
    };
  }

  /**
   * Initialize price history for all resources
   */
  private initializePriceHistory(): void {
    Object.values(ResourceType).forEach(resource => {
      this.priceHistory.set(resource, [{
        price: this.baselinePrices[resource],
        timestamp: new Date(),
        volume: 0
      }]);
    });
  }

  /**
   * Create a new trade offer
   */
  public createTradeOffer(
    sellerId: PlayerId,
    offer: Partial<ResourceCost>,
    request: Partial<ResourceCost>
  ): TradeOffer {
    const offerId = crypto.randomUUID();
    const tradeOffer: TradeOffer = {
      id: offerId,
      sellerId,
      offer,
      request,
      timestamp: new Date(),
      status: 'active'
    };

    this.activeOffers.set(offerId, tradeOffer);
    this.emit('offerCreated', tradeOffer);
    return tradeOffer;
  }

  /**
   * Accept a trade offer
   */
  public acceptTradeOffer(
    buyerId: PlayerId,
    offerId: string
  ): TradeResult {
    const offer = this.activeOffers.get(offerId);
    if (!offer || offer.status !== 'active') {
      return { success: false, message: 'Offer not found or inactive' };
    }

    const transaction: MarketTransaction = {
      offerId,
      sellerId: offer.sellerId,
      buyerId,
      offer: offer.offer,
      request: offer.request,
      timestamp: new Date()
    };

    // Update market state
    this.updateMarketState(transaction);

    // Update offer status
    offer.status = 'completed';
    this.activeOffers.delete(offerId);

    this.emit('tradeConducted', transaction);
    return { success: true, transaction };
  }

  /**
   * Update market prices based on world state and trading activity
   */
  public updateMarketPrices(worldState: WorldState): void {
    const oldPrices = { ...this.marketState.currentPrices };

    Object.values(ResourceType).forEach(resource => {
      const basePrice = this.baselinePrices[resource];
      const volatility = this.marketState.volatility[resource];
      const tradingVolume = this.marketState.tradingVolume.get(resource) || 0;

      // Calculate price modifiers
      const worldStateModifier = this.calculateWorldStateModifier(resource, worldState);
      const volumeModifier = this.calculateVolumeModifier(tradingVolume);
      const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;

      // Update price
      const newPrice = basePrice * worldStateModifier * volumeModifier * randomFactor;
      this.marketState.currentPrices[resource] = Math.max(basePrice * 0.5, Math.min(basePrice * 2, newPrice));

      // Record price history
      this.recordPriceHistory(resource, this.marketState.currentPrices[resource], tradingVolume);
    });

    this.emit('pricesUpdated', {
      oldPrices,
      newPrices: this.marketState.currentPrices
    });
  }

  /**
   * Calculate price modifier based on world state
   */
  private calculateWorldStateModifier(
    resource: ResourceType,
    worldState: WorldState
  ): number {
    const stability = worldState.globalStability;
    const resourceAvailability = worldState.resourceAvailability[resource];

    // Base modifier from global stability
    let modifier = 1 + ((1 - stability) * 0.5);

    // Adjust based on resource availability
    modifier *= (1 + ((1 - resourceAvailability) * 0.3));

    // Special modifiers for specific resources
    switch (resource) {
      case ResourceType.ENERGY:
        modifier *= 1 + (Math.abs(worldState.temperature - 20) / 100);
        break;
      case ResourceType.TECHNOLOGY:
        modifier *= 1 + (worldState.aiActivity.techProgress * 0.2);
        break;
      case ResourceType.MORALE:
        modifier *= 1 + ((1 - stability) * 0.4);
        break;
    }

    return modifier;
  }

  public calculateMarketPrices(): Record<ResourceType, number> {
    // Implement dynamic pricing based on supply/demand
  }

  /**
   * Calculate price modifier based on trading volume
   */
  private calculateVolumeModifier(volume: number): number {
    // Higher volume slightly reduces prices
    return 1 - (Math.min(volume, 1000) / 2000);
  }

  /**
   * Record price history for a resource
   */
  private recordPriceHistory(
    resource: ResourceType,
    price: number,
    volume: number
  ): void {
    const history = this.priceHistory.get(resource) || [];
    history.push({
      price,
      timestamp: new Date(),
      volume
    });

    // Maintain history size limit
    if (history.length > this.maxPriceHistory) {
      history.shift();
    }

    this.priceHistory.set(resource, history);
  }

  /**
   * Update market state with new transaction
   */
  private updateMarketState(transaction: MarketTransaction): void {
    // Update trading volume
    Object.keys(transaction.offer).forEach(resource => {
      const currentVolume = this.marketState.tradingVolume.get(resource as ResourceType) || 0;
      this.marketState.tradingVolume.set(
        resource as ResourceType,
        currentVolume + (transaction.offer[resource] || 0)
      );
    });

    // Update volatility based on trading activity
    Object.keys(transaction.offer).forEach(resource => {
      const currentVolatility = this.marketState.volatility[resource as ResourceType];
      this.marketState.volatility[resource as ResourceType] =
        Math.min(0.5, currentVolatility * (1 + this.volatilityFactor));
    });

    this.marketState.lastUpdate = new Date();
  }

  /**
   * Get current market prices
   */
  public getCurrentPrices(): Record<ResourceType, number> {
    return { ...this.marketState.currentPrices };
  }

  /**
   * Get price history for a resource
   */
  public getPriceHistory(
    resource: ResourceType,
    limit?: number
  ): PriceHistory[] {
    const history = this.priceHistory.get(resource) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get active trade offers
   */
  public getActiveOffers(): TradeOffer[] {
    return Array.from(this.activeOffers.values())
      .filter(offer => offer.status === 'active');
  }

  /**
   * Cancel a trade offer
   */
  public cancelTradeOffer(offerId: string, playerId: PlayerId): boolean {
    const offer = this.activeOffers.get(offerId);
    if (!offer || offer.sellerId !== playerId) {
      return false;
    }

    offer.status = 'cancelled';
    this.activeOffers.delete(offerId);
    this.emit('offerCancelled', offer);
    return true;
  }

  /**
   * Calculate estimated value of resources
   */
  public calculateResourceValue(resources: Partial<ResourceCost>): number {
    return Object.entries(resources).reduce((total, [resource, amount]) => {
      return total + (this.marketState.currentPrices[resource as ResourceType] * (amount || 0));
    }, 0);
  }

  /**
   * Get market statistics
   */
  public getMarketStats(): {
    totalVolume: number;
    averagePrices: Record<ResourceType, number>;
    volatility: Record<ResourceType, number>;
  } {
    const totalVolume = Array.from(this.marketState.tradingVolume.values())
      .reduce((sum, volume) => sum + volume, 0);

    const averagePrices: Record<ResourceType, number> = {} as Record<ResourceType, number>;
    Object.values(ResourceType).forEach(resource => {
      const history = this.priceHistory.get(resource) || [];
      const sum = history.reduce((total, entry) => total + entry.price, 0);
      averagePrices[resource] = sum / (history.length || 1);
    });

    return {
      totalVolume,
      averagePrices,
      volatility: this.marketState.volatility
    };
  }
}