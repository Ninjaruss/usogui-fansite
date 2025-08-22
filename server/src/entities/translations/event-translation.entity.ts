import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Event } from '../event.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('event_translations')
export class EventTranslation extends BaseTranslation {
  @ApiProperty({ 
    description: 'Event this translation belongs to',
    type: () => Event
  })
  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ApiProperty({ description: 'ID of the event being translated' })
  @Column({ name: 'event_id' })
  eventId: number;

  @ApiProperty({ 
    description: 'Translated title of the event',
    example: '17段の試練 (17 Steps Trial)'
  })
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ 
    description: 'Translated description of the event'
  })
  @Column({ type: 'text' })
  description: string;
}
