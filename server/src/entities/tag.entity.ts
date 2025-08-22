import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Event } from './event.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Tag {
  @ApiProperty({ description: 'Unique identifier of the tag' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Name of the tag',
    example: 'High Stakes'
  })
  @Column()
  name: string;

  @ApiProperty({ 
    description: 'Events associated with this tag',
    type: () => [Event]
  })
  @ManyToMany(() => Event, event => event.tags)
  @JoinTable()
  events: Event[];
}
