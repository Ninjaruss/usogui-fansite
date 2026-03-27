import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

export enum EditLogEntityType {
  CHARACTER = 'character',
  GAMBLE = 'gamble',
  ARC = 'arc',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  GUIDE = 'guide',
  MEDIA = 'media',
  ANNOTATION = 'annotation',
  CHAPTER = 'chapter',
}

export enum EditLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity('edit_log')
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class EditLog {
  @ApiProperty({ description: 'Unique identifier of the edit log entry' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Type of entity that was edited',
    enum: EditLogEntityType,
    example: EditLogEntityType.CHARACTER,
  })
  @Column({ type: 'enum', enum: EditLogEntityType })
  entityType: EditLogEntityType;

  @ApiProperty({
    description: 'ID of the entity that was edited',
    example: 1,
  })
  @Column({ type: 'int' })
  entityId: number;

  @ApiProperty({
    description: 'Type of action performed',
    enum: EditLogAction,
    example: EditLogAction.UPDATE,
  })
  @Column({ type: 'enum', enum: EditLogAction })
  action: EditLogAction;

  @ApiPropertyOptional({
    description: 'List of field names that were changed (for update actions)',
    example: ['name', 'description', 'imageUrl'],
  })
  @Column({ type: 'jsonb', nullable: true })
  changedFields: string[] | null;

  @ApiProperty({ description: 'ID of the user who made the edit' })
  @Column()
  userId: number;

  @ApiProperty({
    type: () => User,
    description: 'User who made the edit',
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Date and time when the edit was made' })
  @CreateDateColumn()
  createdAt: Date;
}
