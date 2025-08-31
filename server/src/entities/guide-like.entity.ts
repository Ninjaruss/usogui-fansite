import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity()
@Unique(['userId', 'guideId']) // Prevent duplicate likes from same user
@Index(['guideId'])
@Index(['userId'])
export class GuideLike {
  @ApiProperty({ description: 'Unique identifier of the like' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID of the user who liked the guide' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'User ID (for indexing)' })
  @Column()
  userId: number;

  @ApiProperty({
    description: 'ID of the guide that was liked',
  })
  @ManyToOne('Guide', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guideId' })
  guide: any;

  @ApiProperty({ description: 'Guide ID (for indexing)' })
  @Column()
  guideId: number;

  @ApiProperty({ description: 'Date and time when the like was created' })
  @CreateDateColumn()
  createdAt: Date;
}
