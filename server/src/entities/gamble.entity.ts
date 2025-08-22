import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Character } from './character.entity';
import { Chapter } from './chapter.entity';
import { GambleTeam } from './gamble-team.entity';
import { GambleRound } from './gamble-round.entity';

@Entity()
export class Gamble {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  rules: string;

  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @OneToMany(() => GambleTeam, team => team.gamble, { cascade: true })
  teams: GambleTeam[];

  @OneToMany(() => GambleRound, round => round.gamble, { cascade: true, nullable: true })
  rounds?: GambleRound[];

  @ManyToMany(() => Character)
  @JoinTable({ name: 'gamble_observers' })
  observers: Character[];

  @ManyToOne(() => Chapter)
  chapter: Chapter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
