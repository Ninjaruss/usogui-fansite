import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Series } from './series.entity';
import { Character } from './character.entity';
import { Media } from './media.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Arc {
  @ApiProperty({ description: 'Unique identifier for the arc' })
  @PrimaryGeneratedColumn()
  id: number;


  @ApiProperty({ description: 'Name of the story arc' })
  @Column()
  name: string;

  // Canonical order for arcs
  @ApiProperty({ description: 'Order of the arc in the series', default: 0 })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiPropertyOptional({ description: 'Description of the arc' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Series this arc belongs to' })
  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @ApiPropertyOptional({ description: 'Characters that appear in this arc', type: () => [Character] })
  @OneToMany(() => Character, character => character.arc)
  characters: Character[];

  @ApiPropertyOptional({ description: 'Media associated with this arc', type: () => [Media] })
  @OneToMany(() => Media, media => media.arc, {nullable: true, cascade: true })
  media: Media[];
}
