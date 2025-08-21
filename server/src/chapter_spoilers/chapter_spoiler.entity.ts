import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Event } from '../events/event.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity()
export class ChapterSpoiler {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, event => event.id)
  event: Event;

  @ManyToOne(() => Chapter, chapter => chapter.id)
  chapter: Chapter;
}
