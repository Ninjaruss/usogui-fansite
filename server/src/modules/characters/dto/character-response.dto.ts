import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../../entities/organization.entity';
import { Arc } from '../../../entities/arc.entity';
import { Media } from '../../../entities/media.entity';

export class CharacterResponseDto {
  @ApiProperty({ description: 'Unique identifier of the character' })
  id: number;

  @ApiProperty({ description: "Character's primary name" })
  name: string;

  @ApiPropertyOptional({
    description: 'Alternative names or aliases',
    type: [String],
  })
  alternateNames?: string[];

  @ApiPropertyOptional({ description: 'Character description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Character backstory - detailed history',
  })
  backstory?: string;

  @ApiPropertyOptional({
    description: 'First appearance chapter number',
    example: 1,
  })
  firstAppearanceChapter?: number;

  @ApiPropertyOptional({
    description: 'First major story arc',
    type: () => Arc,
  })
  arc?: Arc;

  @ApiPropertyOptional({
    description: 'Organizations the character belongs to',
    type: () => [Organization],
  })
  organizations?: Organization[];

  @ApiPropertyOptional({
    description: 'Media associated with the character',
    type: () => [Media],
  })
  media?: Media[];

  @ApiPropertyOptional({
    description: 'Number of hidden spoilers',
    example: 3,
  })
  hiddenSpoilerCount?: number;
}
