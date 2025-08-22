import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Gamble } from './gamble.entity';
import { GambleTeam } from './gamble-team.entity';

@Entity()
export class GambleRound {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roundNumber: number;

  @ManyToOne(() => Gamble, gamble => gamble.rounds)
  gamble: Gamble;

  @ManyToOne(() => GambleTeam, { nullable: true })
  winner?: GambleTeam;

  @Column({ type: 'text' })
  outcome: string;

  @Column({ type: 'text', nullable: true })
  reward?: string;

  @Column({ type: 'text', nullable: true })
  penalty?: string;
}
