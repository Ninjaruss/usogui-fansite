import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

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
    description: 'Parent arc ID for sub-arcs',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @ApiPropertyOptional({
    description: 'Parent arc (for sub-arcs)',
    type: () => Arc,
  })
  @ManyToOne(() => Arc, (arc) => arc.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Arc | null;

  @ApiPropertyOptional({
    description: 'Child/sub arcs',
    type: () => [Arc],
  })
  @OneToMany(() => Arc, (arc) => arc.parent)
  children: Arc[];

  // Media relationships are now handled polymorphically through the Media entity
  // with ownerType='arc' and ownerId=arc.id

  @ApiProperty({ description: 'Whether this arc page has been verified by a moderator' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'ID of the moderator who last verified this page' })
  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @ApiPropertyOptional({ description: 'When this page was last verified' })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;
}
