import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Index,
} from 'typeorm';
import { Media } from './media.entity';
import { Faction } from './faction.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['name'])
export class Character {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: "Character's primary name",
    example: 'Baku Madarame',
  })
  @Column({ length: 100 })
  name: string;

  @ApiPropertyOptional({
    description: 'Alternative names or aliases',
    type: [String],
    example: ['The Emperor', 'Death God'],
  })
  @Column({ type: 'simple-array', nullable: true })
  alternateNames: string[];

  @ApiPropertyOptional({
    description: 'Character description',
    example: 'A professional gambler known for taking on dangerous bets.',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({
    description: 'Chapter number where the character first appears',
    example: 1,
  })
  @Column({ nullable: true })
  firstAppearanceChapter: number;

  @ApiPropertyOptional({
    description: 'Notable roles or positions',
    type: [String],
    example: ['Kakerou Company CEO', 'Professional Gambler'],
  })
  @Column({ type: 'simple-array', nullable: true })
  notableRoles: string[];

  @ApiPropertyOptional({
    description: 'Notable games participated in',
    type: [String],
    example: ['17 Steps', 'One-Card Poker'],
  })
  @Column({ type: 'simple-array', nullable: true })
  notableGames: string[];

  @ApiPropertyOptional({
    description: "Character's occupation or profession",
    example: 'Professional Gambler',
  })
  @Column({ nullable: true })
  occupation: string;

  @ApiPropertyOptional({
    description:
      'Organizations or groups the character is affiliated with (besides factions)',
    type: [String],
    example: ['Kakerou Company', 'Tournament Committee'],
  })
  @Column({ type: 'simple-array', nullable: true })
  affiliations: string[];

  @ApiPropertyOptional({
    description: 'Media associated with the character',
    type: () => [Media],
  })
  @OneToMany(() => Media, (media) => media.character, {
    nullable: true,
    cascade: true,
  })
  media: Media[];

  @ApiPropertyOptional({
    description: 'Factions the character belongs to',
    type: () => [Faction],
  })
  @ManyToMany(() => Faction, (faction) => faction.characters)
  factions: Faction[];

  @ApiPropertyOptional({
    description: 'Quotes said by this character',
    type: () => ['Quote'],
  })
  @OneToMany('Quote', (quote: any) => quote.character, {
    nullable: true,
    cascade: true,
  })
  quotes: any[];
}
