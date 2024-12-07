import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GameService } from './game.service';
import { AuthGuard } from '../auth/auth.guard';
import { SubmitActionDto } from './dto/submit-action.dto';

@ApiTags('Game')
@Controller('game')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('action')
  @ApiOperation({ summary: 'Submit a game action' })
  async submitAction(@Body() action: SubmitActionDto) {
    return this.gameService.submitAction(action);
  }

  @Get('state/:gameId')
  @ApiOperation({ summary: 'Get current game state' })
  async getGameState(@Param('gameId') gameId: string) {
    return this.gameService.getGameState(gameId);
  }

  @Get('cycle/:gameId')
  @ApiOperation({ summary: 'Get current game cycle information' })
  async getGameCycle(@Param('gameId') gameId: string) {
    return this.gameService.getGameCycle(gameId);
  }

  @Get('players/:gameId')
  @ApiOperation({ summary: 'Get active players in game' })
  async getActivePlayers(@Param('gameId') gameId: string) {
    return this.gameService.getActivePlayers(gameId);
  }
}