import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { User } from './user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['character'])
@Index(['chapterNumber'])
@Index(['submittedBy'])
export class Quote {
  @ApiProperty({ description: 'Unique identifier of the quote' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The actual quote text',
    example:
      "The essence of gambling is not about winning or losing... it's about the thrill of the unknown.",
  })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({
    description: 'Chapter number where this quote appears',
    example: 1,
  })
  @Column()
  chapterNumber: number;

  @ApiPropertyOptional({
    description: 'Additional context or description about the quote',
    example: 'Said during the first gambling match with Kaji',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({
    description: 'Page number where the quote appears in the chapter',
    example: 15,
  })
  @Column({ nullable: true })
  pageNumber: number;

  @ApiProperty({
    description: 'Character who said this quote',
    type: () => Character,
  })
  @ManyToOne(() => Character, (character) => character.quotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ApiProperty({
    description: 'ID of the character who said this quote',
    example: 1,
  })
  @Column()
  characterId: number;

  @ApiPropertyOptional({
    description: 'User who submitted this quote',
    type: () => User,
  })
  @ManyToOne(() => User, { nullable: true })
  submittedBy: User;

  @ApiProperty({ description: 'When this quote was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When this quote was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
