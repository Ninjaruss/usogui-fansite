import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { Chapter } from './chapter.entity';
import { GambleCharacter } from './gamble-character.entity';
import { GambleRound } from './gamble-round.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Gamble {
  @ApiProperty({ description: 'Unique identifier of the gamble' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the gamble',
    example: 'Protoporos',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Rules of the gamble',
    example: 'Two players take turns removing stones from a pile...',
  })
  @Column({ type: 'text' })
  rules: string;

  @ApiPropertyOptional({
    description: 'Condition for winning the gamble',
    example: 'The player who removes the last stone loses',
  })
  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @ApiPropertyOptional({
    description: 'Characters participating in this gamble',
    type: () => [GambleCharacter],
  })
  @OneToMany(() => GambleCharacter, (participant) => participant.gamble, {
    cascade: true,
    eager: true,
  })
  participants: GambleCharacter[];

  @ApiPropertyOptional({
    description: 'Rounds of this gamble',
    type: () => [GambleRound],
  })
  @OneToMany(() => GambleRound, (round) => round.gamble, {
    cascade: true,
    nullable: true,
  })
  rounds?: GambleRound[];

  @ApiPropertyOptional({
    description: 'Characters observing this gamble',
    type: () => [Character],
  })
  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_observers' })
  observers: Character[];

  @ApiProperty({
    description: 'Chapter number where this gamble takes place',
    example: 45,
  })
  @Column()
  chapterId: number;

  @ApiPropertyOptional({
    description: 'Chapter where this gamble takes place',
    type: () => Chapter,
  })
  @ManyToOne(() => Chapter, { nullable: true })
  @JoinColumn({ name: 'chapterId' })
  chapter?: Chapter;

  @ApiPropertyOptional({
    description: 'Whether this gamble uses teams (false for 1v1s)',
    default: false,
  })
  @Column({ default: false })
  hasTeams: boolean;

  @ApiPropertyOptional({
    description: 'Winning team name if hasTeams is true',
    example: 'Team Baku',
  })
  @Column({ nullable: true })
  winnerTeam?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
