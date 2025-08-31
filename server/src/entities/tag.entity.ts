import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
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
    type: () => [Event],
  })
  @ManyToMany(() => Event, (event) => event.tags)
  @JoinTable()
  events: Event[];
}
