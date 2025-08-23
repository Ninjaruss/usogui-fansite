import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Gamble } from '../gamble.entity';
import { BaseTranslation } from './base-translation.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('gamble_translations')
export class GambleTranslation extends BaseTranslation {
  @ApiProperty({ 
    description: 'Gamble this translation belongs to',
    type: () => Gamble
  })
  @ManyToOne(() => Gamble, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gamble_id' })
  gamble: Gamble;

  @ApiProperty({ description: 'ID of the gamble being translated' })
  @Column({ name: 'gamble_id' })
  gambleId: number;

  @ApiProperty({ 
    description: 'Translated name of the gamble',
    example: 'エアポーカー (Air Poker)'
  })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ 
    description: 'Translated rules of the gamble',
    example: 'プレイヤーは手札なしで...'
  })
  @Column({ type: 'text' })
  rules: string;

  @ApiPropertyOptional({ 
    description: 'Translated win condition',
    example: '最初に3回勝利したプレイヤーが勝者となる'
  })
  @Column({ type: 'text', nullable: true })
  winCondition?: string;
}
