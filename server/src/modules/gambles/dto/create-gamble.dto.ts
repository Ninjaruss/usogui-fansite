import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGambleParticipantDto {
  @ApiProperty({
    description: 'ID of the character participating',
    example: 1,
  })
  @IsNumber()
  characterId: number;

  @ApiPropertyOptional({
    description: 'Team name if this gamble uses teams (leave empty for 1v1s)',
    example: 'Team Baku',
  })
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiProperty({
    description: 'Whether this character won the gamble',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isWinner?: boolean;

  @ApiPropertyOptional({
    description: 'What this character/team is betting/risking in the gamble',
    example: '100 million yen, right hand',
  })
  @IsOptional()
  @IsString()
  stake?: string;
}

export class CreateGambleRoundDto {
  @ApiProperty({
    description: 'Round number in sequence',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  roundNumber: number;

  @ApiPropertyOptional({
    description: 'Team name that won this round (for team-based gambles)',
    example: 'Team Baku',
  })
  @IsOptional()
  @IsString()
  winnerTeam?: string;

  @ApiProperty({
    description: 'Detailed description of what happened in this round',
    example:
      "Baku revealed his hand showing the Ace of Spades, beating Marco's King of Hearts",
  })
  @IsString()
  outcome: string;

  @ApiPropertyOptional({
    description: 'What the winner gained this round (money, items, advantages)',
    example: '20 million yen',
  })
  @IsOptional()
  @IsString()
  reward?: string;

  @ApiPropertyOptional({
    description:
      'What the loser lost/suffered this round (body parts, position, disadvantages)',
    example: 'Lost right hand',
  })
  @IsOptional()
  @IsString()
  penalty?: string;
}

export class CreateGambleDto {
  @ApiProperty({
    description: 'Name of the gamble/game',
    example: 'One-Card Poker Death Match',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed rules of the game',
    example:
      'Each player draws one card from a standard deck. The player with the higher card wins. Aces are high. In case of a tie, new cards are drawn.',
  })
  @IsString()
  rules: string;

  @ApiPropertyOptional({
    description: 'Specific win condition if different from basic rules',
    example: 'First player to win 3 rounds claims final victory',
  })
  @IsOptional()
  @IsString()
  winCondition?: string;

  @ApiPropertyOptional({
    description: 'Whether this gamble uses teams (false for 1v1s)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasTeams?: boolean;

  @ApiProperty({
    description:
      'Characters participating in the gamble. Minimum 2 participants required.',
    type: [CreateGambleParticipantDto],
    minItems: 2,
    example: [
      {
        characterId: 1,
        teamName: 'Team Baku',
        isWinner: true,
        stake: '100 million yen',
      },
      {
        characterId: 2,
        teamName: 'Team Marco',
        isWinner: false,
        stake: 'Right hand',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(2)
  participants: CreateGambleParticipantDto[];

  @ApiPropertyOptional({
    description:
      'Individual rounds for multi-round games. Omit for single-round games.',
    type: [CreateGambleRoundDto],
    example: [
      {
        roundNumber: 1,
        outcome:
          'Baku draws Ace of Spades, Marco draws King of Hearts. Baku wins.',
        winnerTeamId: 1,
        reward: '20 million yen',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  rounds?: CreateGambleRoundDto[];

  @ApiPropertyOptional({
    description:
      'IDs of characters who observed or judged the gamble but did not participate',
    type: [Number],
    example: [3],
  })
  @IsOptional()
  @IsArray()
  observerIds?: number[];

  @ApiProperty({
    description: 'ID of the chapter where this gamble occurs',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  chapterId: number;
}
