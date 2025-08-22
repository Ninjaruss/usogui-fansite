import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTranslation } from './base-translation.entity';
import { Event } from '../event.entity';

@Entity('event_translations')
export class EventTranslation extends BaseTranslation {
  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;
}
