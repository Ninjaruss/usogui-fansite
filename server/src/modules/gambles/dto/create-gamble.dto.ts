import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  MaxLength,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FactionMemberRole } from '../../../entities/gamble-faction-member.entity';

/**
 * DTO for creating a faction within a gamble
 */
export class CreateFactionDto {
  @ApiPropertyOptional({
    description: 'Custom name for this faction (e.g., "Kakerou", "L\'air")',
    example: 'Kakerou',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'ID of the main gambler this faction supports',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  supportedGamblerId?: number;

  @ApiProperty({
    description: 'Array of character IDs who are members of this faction',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  memberIds: number[];

  @ApiPropertyOptional({
    description:
      'Array of roles corresponding to each member (same order as memberIds)',
    example: ['leader', 'member', 'supporter'],
    enum: FactionMemberRole,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(FactionMemberRole, { each: true })
  memberRoles?: FactionMemberRole[];
}

export class CreateGambleDto {
  @ApiProperty({
    description: 'Name of the gamble/game',
    example: 'One-Card Poker Death Match',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Brief description of the gamble',
    example: 'A high-stakes card game where each player draws one card',
  })
  @IsOptional()
  @IsString()
  description?: string;

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
    description:
      'In-depth explanation of gamble mechanics, strategy, and analysis',
    example:
      'This gamble relies on psychological warfare and probability calculation. The key to victory is...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15000)
  explanation?: string;

  @ApiProperty({
    description: 'ID of the chapter where this gamble occurs',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  chapterId: number;

  @ApiPropertyOptional({
    description:
      'Array of character IDs who participated in this gamble (legacy, use factions instead)',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];

  @ApiPropertyOptional({
    description:
      'Array of factions/teams participating in this gamble with their members',
    type: [CreateFactionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFactionDto)
  factions?: CreateFactionDto[];
}
