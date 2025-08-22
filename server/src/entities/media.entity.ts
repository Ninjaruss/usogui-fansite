import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, ManyToMany } from 'typeorm';
import { Arc } from './arc.entity';
import { Character } from './character.entity';
import { Event } from './event.entity';
import { User } from './user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MediaStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity()
export class Media {
  @ApiProperty({ description: 'Unique identifier of the media' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'URL or file path to the media content',
    example: 'https://example.com/images/character1.jpg'
  })
  @Column()
  url: string;

  @ApiPropertyOptional({ 
    description: 'Type of media content',
    example: 'image',
    enum: ['image', 'video', 'audio']
  })
  @Column({ nullable: true })
  type: string;

  @ApiPropertyOptional({ 
    description: 'Description of the media content',
    example: 'Character illustration from Chapter 45'
  })
  @Column({ nullable: true })
  description: string;

  @ApiPropertyOptional({ 
    description: 'Story arc this media belongs to',
    type: () => Arc
  })
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
