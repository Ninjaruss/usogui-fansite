import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany } from 'typeorm';
import { Arc } from './arc.entity';
import { Series } from './series.entity';
import { Media } from './media.entity';
import { Faction } from './faction.entity';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'simple-array', nullable: true })
  alternateNames: string[]; // For aliases or nicknames shown in manga

  @Column({ type: 'text', nullable: true })
  description: string;

  // First appearance information
  @Column({ nullable: true })
  firstAppearanceChapter: number;

  // Character relationships/roles that are explicitly shown
  @Column({ type: 'simple-array', nullable: true })
  notableRoles: string[]; // e.g., ["Kakerou Company CEO", "Professional Gambler"]

  @Column({ type: 'simple-array', nullable: true })
  notableGames: string[]; // Games they've participated in

  // Basic factual info that appears in manga
  @Column({ nullable: true })
  occupation: string;

  @Column({ type: 'simple-array', nullable: true })
  affiliations: string[]; // Organizations/groups mentioned besides factions

  // Relationships
  @ManyToOne(() => Arc, arc => arc.characters, { nullable: true })
  arc: Arc; // First major arc appearance

  @ManyToOne(() => Series, series => series.id)
  series: Series;

  @OneToMany(() => Media, media => media.character, {nullable: true, cascade: true })
  media: Media[];

  @ManyToMany(() => Faction, faction => faction.characters)
  factions: Faction[];

}
