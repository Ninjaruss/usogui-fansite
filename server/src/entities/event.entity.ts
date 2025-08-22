import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { Series } from './series.entity';
import { Media } from './media.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Event {
  @ApiProperty({ description: 'Unique identifier of the event' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Title of the event',
    example: 'The 17 Steps Tournament'
  })
  @Column()
  title: string;

  @ApiProperty({ 
    description: 'Detailed description of the event',
    example: 'A high-stakes tournament where participants must climb 17 steps...'
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ 
    description: 'Chapter where the event starts',
    example: 45
  })
  @Column()
  startChapter: number;

  @ApiPropertyOptional({ 
    description: 'Chapter where the event ends',
    example: 52
  })
  @Column({ nullable: true })
  endChapter: number;

  @ApiPropertyOptional({ 
    description: 'Story arc this event belongs to',
    type: () => Arc
  })
  @ManyToOne(() => Arc, arc => arc.id, { nullable: true })
  arc: Arc;

  @ApiProperty({ 
    description: 'Characters involved in this event',
    type: () => [Character]
  })
  @ManyToMany(() => Character)
  @JoinTable()
  characters: Character[];

  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @OneToMany(() => Media, media => media.event, {nullable: true, cascade: true })
  media: Media[];

  @ManyToOne(() => User, user => user.submittedEvents, { nullable: true })
  createdBy: User;

  @ManyToMany(() => Tag, tag => tag.events)
  tags: Tag[];
}
