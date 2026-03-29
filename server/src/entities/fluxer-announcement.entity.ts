import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fluxer_announcement')
export class FluxerAnnouncement {
  @ApiProperty({
    description: 'Always 1 — enforces single-row constraint',
    example: 1,
  })
  @PrimaryColumn({ type: 'int' })
  id: number;

  @ApiProperty({
    description: 'Discord message ID',
    example: '1234567890123456789',
  })
  @Column({ type: 'varchar' })
  messageId: string;

  @ApiProperty({
    description: 'Announcement content',
    example: '@everyone Important update: ...',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'Username of the announcement author',
    example: 'Admin',
  })
  @Column({ type: 'varchar' })
  authorUsername: string;

  @ApiProperty({
    description: 'Fluxer user ID of the author',
    example: '123456789',
  })
  @Column({ type: 'varchar' })
  authorId: string;

  @ApiProperty({
    description: 'Timestamp when the announcement was posted',
    example: '2026-03-28T12:00:00Z',
  })
  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @ApiProperty({
    description: 'Timestamp when the announcement was last updated in the database',
    example: '2026-03-28T12:00:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
