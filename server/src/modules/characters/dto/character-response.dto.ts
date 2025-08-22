import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Faction } from '../../../entities/faction.entity';
import { Arc } from '../../../entities/arc.entity';
import { Media } from '../../../entities/media.entity';

export class CharacterResponseDto {
  @ApiProperty({ description: 'Unique identifier of the character' })
  id: number;

  @ApiProperty({ description: 'Character\'s primary name' })
  name: string;

  @ApiPropertyOptional({ 
    description: 'Alternative names or aliases',
    type: [String]
  })
  alternateNames?: string[];

  @ApiPropertyOptional({ description: 'Character description' })
  description?: string;

  @ApiPropertyOptional({ 
    description: 'First appearance chapter number',
    example: 1
  })
  firstAppearanceChapter?: number;

  @ApiPropertyOptional({ 
    description: 'Notable roles or positions',
    type: [String]
  })
  notableRoles?: string[];

  @ApiPropertyOptional({ 
    description: 'Notable games participated in',
    type: [String]
  })
  notableGames?: string[];

  @ApiPropertyOptional({ description: 'Character\'s occupation' })
  occupation?: string;

  @ApiPropertyOptional({ 
    description: 'Other affiliations',
    type: [String]
  })
  affiliations?: string[];

  @ApiPropertyOptional({ 
    description: 'First major story arc',
    type: () => Arc
  })
  arc?: Arc;

  @ApiPropertyOptional({ 
    description: 'Factions the character belongs to',
    type: () => [Faction]
  })
  factions?: Faction[];

  @ApiPropertyOptional({ 
    description: 'Media associated with the character',
    type: () => [Media]
  })
  media?: Media[];

  @ApiPropertyOptional({ 
    description: 'Number of hidden spoilers',
    example: 3
  })
  hiddenSpoilerCount?: number;
}
