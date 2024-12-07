import { IsString, IsEnum, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ActionType {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  BUILD = 'BUILD',
  RESEARCH = 'RESEARCH',
  TRADE = 'TRADE',
  DIPLOMACY = 'DIPLOMACY',
  SPECIAL = 'SPECIAL'
}

export class SubmitActionDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  type: ActionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gameId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({ type: 'object' })
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  region: string;
}