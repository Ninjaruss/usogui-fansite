import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Media } from './media.entity';
import { Character } from './character.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
@Index(['mediaId'])
@Index(['characterId'])
@Index(['usageCount'])
@Unique(['mediaId'])
export class CharacterMediaPopularity {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID of the media being tracked',
    example: 1,
  })
  @Column({ type: 'int' })
  mediaId: number;

  @ApiProperty({
    description: 'ID of the character this media belongs to',
    example: 1,
  })
  @Column({ type: 'int' })
  characterId: number;

  @ApiProperty({
    description: 'Name of the character for easy querying',
    example: 'Baku Madarame',
  })
  @Column({ type: 'varchar' })
  characterName: string;

  @ApiProperty({
    description: 'Chapter number associated with this media',
    example: 45,
  })
  @Column({ type: 'int', nullable: true })
  chapterNumber: number | null;

  @ApiProperty({
    description:
      'Number of users currently using this media as profile picture',
    example: 15,
  })
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ApiProperty({
    description: 'The media entity being tracked',
    type: () => Media,
  })
  @ManyToOne(() => Media, { nullable: false })
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @ApiProperty({
    description: 'The character this media represents',
    type: () => Character,
  })
  @ManyToOne(() => Character, { nullable: false })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
