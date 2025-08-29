import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['name'])
@Index(['order'])
export class Arc {
  @ApiProperty({ description: 'Unique identifier for the arc' })
  @PrimaryGeneratedColumn()
  id: number;


  @ApiProperty({ 
    description: 'Name of the story arc',
    example: '17 Steps Tournament Arc'
  })
  @Column({ length: 100 })
  name: string;

  // Canonical order for arcs
  @ApiProperty({ 
  description: 'Order of the arc',
    default: 0,
    example: 1
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiPropertyOptional({ 
    description: 'Description of the arc',
    example: 'A high-stakes tournament arc where participants must climb 17 steps...'
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ 
    description: 'Chapter number where this arc starts',
    example: 1
  })
  @Column({ nullable: true })
  startChapter: number;

  @ApiPropertyOptional({ 
    description: 'Chapter number where this arc ends',
    example: 10
  })
  @Column({ nullable: true })
  endChapter: number;
}
