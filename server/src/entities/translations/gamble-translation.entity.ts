import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Gamble } from '../gamble.entity';

@Entity()
export class GambleTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Gamble, { onDelete: 'CASCADE' })
  gamble: Gamble;

  @Column()
  languageCode: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  rules: string;

  @Column({ type: 'text', nullable: true })
  winCondition?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
