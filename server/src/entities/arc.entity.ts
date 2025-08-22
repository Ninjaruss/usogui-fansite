import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Series } from './series.entity';
import { Character } from './character.entity';
import { Media } from './media.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['series'])
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
    description: 'Order of the arc in the series',
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

  @ApiProperty({ description: 'Series this arc belongs to' })
  @ManyToOne(() => Series, series => series.id, {
    nullable: false,
    onDelete: 'CASCADE'  // If series is deleted, delete all its arcs
  })
  series: Series;

  @ApiPropertyOptional({ description: 'Characters that appear in this arc', type: () => [Character] })
  @OneToMany(() => Character, character => character.arc)
  characters: Character[];

  @ApiPropertyOptional({ description: 'Media associated with this arc', type: () => [Media] })
  @OneToMany(() => Media, media => media.arc, {nullable: true, cascade: true })
  media: Media[];
}
