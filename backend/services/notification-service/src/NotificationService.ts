import { EventEmitter } from 'events';

/**
 * Notification types for in-game events.
 */
export enum NotificationType {
  WARNING = 'WARNING',
  REMINDER = 'REMINDER',
  ACHIEVEMENT = 'ACHIEVEMENT'
}

/**
 * Interface for notification payloads.
 */
export interface Notification {
  type: NotificationType;
  message: string;
  timestamp: Date;
  playerId?: string; // Optional: Notifications can be global or player-specific.
}

/**
 * Service to handle in-game notifications.
 */
export class NotificationService extends EventEmitter {
  private notifications: Notification[];

  constructor() {
    super();
    this.notifications = [];
  }

  /**
   * Send a new notification.
   * @param notification - The notification to send.
   */
  public sendNotification(notification: Notification): void {
    this.notifications.push(notification);
    this.emit('notification', notification);
  }

  /**
   * Get all notifications.
   * @returns List of notifications.
   */
  public getAllNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Get notifications for a specific player.
   * @param playerId - The id of the player.
   * @returns List of notifications for the specified player.
   */
  public getNotificationsForPlayer(playerId: string): Notification[] {
    return this.notifications.filter(notification => notification.playerId === playerId);
  }

  /**
   * Clear all notifications (useful for testing or resetting state).
   */
  public clearNotifications(): void {
    this.notifications = [];
  }
}
