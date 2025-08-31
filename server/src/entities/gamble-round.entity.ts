import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Gamble } from './gamble.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class GambleRound {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Round number in sequence' })
  @Column()
  roundNumber: number;

  @ApiProperty({
    description: 'The gamble this round belongs to',
    type: () => Gamble,
  })
  @ManyToOne(() => Gamble, (gamble) => gamble.rounds, { onDelete: 'CASCADE' })
  gamble: Gamble;

  @ApiPropertyOptional({
    description: 'Team name that won this round (for team-based gambles)',
    example: 'Team Baku',
  })
  @Column({ nullable: true })
  winnerTeam?: string;

  @ApiProperty({ description: 'What happened in this round' })
  @Column({ type: 'text' })
  outcome: string;

  @ApiPropertyOptional({ description: 'What the winner gained' })
  @Column({ type: 'text', nullable: true })
  reward?: string;

  @ApiPropertyOptional({ description: 'What the loser suffered' })
  @Column({ type: 'text', nullable: true })
  penalty?: string;
}
