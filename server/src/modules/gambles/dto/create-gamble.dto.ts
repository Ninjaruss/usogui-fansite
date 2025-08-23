import { IsString, IsNumber, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGambleTeamDto {
  @ApiProperty({
    description: 'Name of the team or individual (e.g., "Kakerou" or "Baku\'s Side")',
    example: 'Kakerou'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'IDs of characters in this team. For 1v1s, array will contain single character ID',
    type: [Number],
    example: [1, 2],
    minimum: 1
  })
  @IsArray()
  @ArrayMinSize(1)
  memberIds: number[];

  @ApiPropertyOptional({
    description: 'What this team is betting/risking in the gamble',
    example: '100 million yen, control of Kakerou, right hand'
  })
  @IsOptional()
  @IsString()
  stake?: string;
}

export class CreateGambleRoundDto {
  @ApiProperty({
    description: 'Round number in sequence',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  roundNumber: number;

  @ApiPropertyOptional({
    description: 'ID of the team that won this round. Omit for draws or unclear outcomes',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  winnerTeamId?: number;

  @ApiProperty({
    description: 'Detailed description of what happened in this round',
    example: 'Baku revealed his hand showing the Ace of Spades, beating Marco\'s King of Hearts'
  })
  @IsString()
  outcome: string;

  @ApiPropertyOptional({
    description: 'What the winner gained this round (money, items, advantages)',
    example: '20 million yen'
  })
  @IsOptional()
  @IsString()
  reward?: string;

  @ApiPropertyOptional({
    description: 'What the loser lost/suffered this round (body parts, position, disadvantages)',
    example: 'Lost right hand'
  })
  @IsOptional()
  @IsString()
  penalty?: string;
}

export class CreateGambleDto {
  @ApiProperty({
    description: 'Name of the gamble/game',
    example: 'One-Card Poker Death Match'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed rules of the game',
    example: 'Each player draws one card from a standard deck. The player with the higher card wins. Aces are high. In case of a tie, new cards are drawn.'
  })
  @IsString()
  rules: string;

  @ApiPropertyOptional({
    description: 'Specific win condition if different from basic rules',
    example: 'First player to win 3 rounds claims final victory'
  })
  @IsOptional()
  @IsString()
  winCondition?: string;

  @ApiProperty({
    description: 'Teams or individuals participating in the gamble. Minimum 2 teams required.',
    type: [CreateGambleTeamDto],
    minItems: 2,
    example: [
      {
        name: "Baku's Side",
        memberIds: [1],
        stake: "100 million yen"
      },
      {
        name: "Marco's Side",
        memberIds: [2],
        stake: "Right hand"
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(2)
  teams: CreateGambleTeamDto[];

  @ApiPropertyOptional({
    description: 'Individual rounds for multi-round games. Omit for single-round games.',
    type: [CreateGambleRoundDto],
    example: [
      {
        roundNumber: 1,
        outcome: "Baku draws Ace of Spades, Marco draws King of Hearts. Baku wins.",
        winnerTeamId: 1,
        reward: "20 million yen"
      }
    ]
  })
  @IsOptional()
  @IsArray()
  rounds?: CreateGambleRoundDto[];

  @ApiPropertyOptional({
    description: 'IDs of characters who observed or judged the gamble but did not participate',
    type: [Number],
    example: [3]
  })
  @IsOptional()
  @IsArray()
  observerIds?: number[];

  @ApiProperty({
    description: 'ID of the chapter where this gamble occurs',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  chapterId: number;
}
