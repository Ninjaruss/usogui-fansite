import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['name'])
@Index(['order'])
export class Arc {
  @ApiProperty({ description: 'Unique identifier for the arc' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the story arc',
    example: '17 Steps Tournament Arc',
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // Canonical order for arcs
  @ApiProperty({
    description: 'Order of the arc',
    default: 0,
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiPropertyOptional({
    description: 'Description of the arc',
    example:
      'A high-stakes tournament arc where participants must climb 17 steps...',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Chapter number where this arc starts',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  startChapter: number | null;

  @ApiPropertyOptional({
    description: 'Chapter number where this arc ends',
    example: 10,
  })
  @Column({ type: 'int', nullable: true })
  endChapter: number | null;

  @ApiPropertyOptional({
    description: 'Main arc image/cover art filename',
    example: '17-steps-tournament-cover.webp',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  imageFileName: string | null;

  @ApiPropertyOptional({
    description: 'Display name for the arc image',
    example: '17 Steps Tournament - Official Cover',
  })
  @Column({ type: 'varchar', nullable: true, length: 200 })
  imageDisplayName: string | null;
}
