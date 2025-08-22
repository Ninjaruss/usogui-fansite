import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Arc } from './arc.entity';
import { Series } from './series.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['series'])
@Index(['arc'])
export class Chapter {
  @ApiProperty({ description: 'Unique identifier of the chapter' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Chapter number in the series',
    example: 1
  })
  @Column()
  number: number;

  @ApiPropertyOptional({ 
    description: 'Title of the chapter',
    example: 'The Beginning of Fate'
  })
  @Column({ nullable: true, length: 200 })
  title: string;

  @ApiPropertyOptional({ 
    description: 'Brief summary of the chapter\'s content'
  })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @ApiPropertyOptional({ 
    description: 'Story arc this chapter belongs to',
    type: () => Arc
  })
  @ManyToOne(() => Arc, arc => arc.id, { 
    nullable: true,
    onDelete: 'SET NULL'  // If arc is deleted, just set arc to null for chapters
  })
  arc: Arc;

  @ApiProperty({ 
    description: 'Series this chapter belongs to',
    type: () => Series
  })
  @ManyToOne(() => Series, series => series.id, {
    onDelete: 'CASCADE'  // If series is deleted, delete all its chapters
  })
  series: Series;
}
