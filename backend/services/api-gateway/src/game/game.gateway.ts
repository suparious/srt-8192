import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: true,
  namespace: 'game',
  transports: ['websocket'],
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(client: Socket, gameId: string) {
    await client.join(`game:${gameId}`);
    const gameState = await this.gameService.getGameState(gameId);
    client.emit('gameState', gameState);
  }

  @SubscribeMessage('leaveGame')
  async handleLeaveGame(client: Socket, gameId: string) {
    await client.leave(`game:${gameId}`);
  }

  @OnEvent('cycle.end')
  handleCycleEnd(payload: any) {
    // Broadcast cycle end to all connected clients in the game
    this.server.to(`game:${payload.gameId}`).emit('cycleEnd', {
      cycle: payload.cycle,
      timestamp: payload.timestamp,
      actions: payload.actions
    });
  }

  @OnEvent('game.end')
  handleGameEnd(payload: any) {
    // Broadcast game end to all connected clients
    this.server.emit('gameEnd', {
      timestamp: payload.timestamp
    });
  }

  // Broadcast updated game state to all clients in a game
  broadcastGameState(gameId: string, state: any) {
    this.server.to(`game:${gameId}`).emit('gameState', state);
  }

  // Broadcast player action to all clients in a game
  broadcastPlayerAction(gameId: string, action: any) {
    this.server.to(`game:${gameId}`).emit('playerAction', action);
  }
}