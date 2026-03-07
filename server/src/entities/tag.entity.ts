import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
// import type removes runtime require() to break tag <-> event circular dep
import type { Event } from './event.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
@Index(['name'], { unique: true }) // Tags should be unique
export class Tag {
  @ApiProperty({ description: 'Unique identifier of the tag' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the tag',
    example: 'High Stakes',
  })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({
    description: 'Description of what this tag represents',
    example: 'Content involving high-stakes gambling scenarios',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    type: () => [require('./event.entity').Event],
  })
  @ManyToMany(() => require('./event.entity').Event, (event) => event.tags)
  @JoinTable()
  events: Event[];
}
