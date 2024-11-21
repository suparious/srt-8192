import { EventEmitter } from 'events';

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp: Date;
}

class ChatService extends EventEmitter {
  private messages: ChatMessage[];
  private maxMessageHistory: number;

  constructor(maxMessageHistory: number = 100) {
    super();
    this.messages = [];
    this.maxMessageHistory = maxMessageHistory;
  }

  /**
   * Send a new chat message.
   */
  public sendMessage(senderId: string, message: string): void {
    const newMessage: ChatMessage = {
      senderId,
      message,
      timestamp: new Date(),
    };
    
    this.messages.push(newMessage);
    this.trimMessageHistory();
    this.emit('message', newMessage);
  }

  /**
   * Get recent chat messages.
   */
  public getRecentMessages(limit: number = 20): ChatMessage[] {
    return this.messages.slice(-limit);
  }

  /**
   * Trim message history to maintain the max message history size.
   */
  private trimMessageHistory(): void {
    if (this.messages.length > this.maxMessageHistory) {
      this.messages = this.messages.slice(-this.maxMessageHistory);
    }
  }

  /**
   * Register a listener for new messages.
   */
  public onMessage(listener: (message: ChatMessage) => void): void {
    this.on('message', listener);
  }
}

// Example usage
const chatService = new ChatService();
chatService.onMessage((message) => {
  console.log(`[${message.timestamp.toISOString()}] ${message.senderId}: ${message.message}`);
});
chatService.sendMessage('player1', 'Hello, world!');
chatService.sendMessage('player2', 'Hey there!');

export { ChatService, ChatMessage };
