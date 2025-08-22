import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Character } from './character.entity';
import { Gamble } from './gamble.entity';

@Entity()
export class GambleTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Gamble, gamble => gamble.teams)
  gamble: Gamble;

  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_team_members' })
  members: Character[];

  @Column({ type: 'text', nullable: true })
  stake?: string;
}
