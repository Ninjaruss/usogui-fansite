import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Character } from '../character.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('character_translations')
export class CharacterTranslation extends BaseTranslation {
  @ApiProperty({
    description: 'Character this translation belongs to',
    type: () => Character,
  })
  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character: Character;

  @ApiProperty({
    description: 'ID of the character being translated',
  })
  @Column({ name: 'character_id' })
  characterId: number;

  @ApiProperty({
    description: 'Translated name of the character',
    example: 'ブラー (Bura)',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiPropertyOptional({
    description: 'Translated description of the character',
  })
  @Column({ type: 'text', nullable: true })
  description: string;
}
