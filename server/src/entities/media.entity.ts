import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, ManyToMany } from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { Event } from './event.entity';
import { User } from './user.entity';

export enum MediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // could be external URL or internal file path

  @Column({ nullable: true })
  type: string; // e.g. "image", "video", "audio"

  @Column({ nullable: true })
  description: string;

  // Relations
  @ManyToOne(() => Arc, arc => arc.media, { onDelete: 'CASCADE', nullable: true })
  arc: Arc;

  @ManyToOne(() => Character, character => character.media, { onDelete: 'CASCADE', nullable: true })
  character: Character;
  
  @ManyToOne(() => Event, event => event.media, { onDelete: 'CASCADE', nullable: true  })
  event: Event;

  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.PENDING })
  status: MediaStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  submittedBy: User;
}
