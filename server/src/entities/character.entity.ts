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
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({
    description: 'Alternative names or aliases',
    type: [String],
    example: ['The Emperor', 'Death God'],
  })
  @Column({ type: 'simple-array', nullable: true })
  alternateNames: string[] | null;

  @ApiPropertyOptional({
    description: 'Character description',
    example: 'A professional gambler known for taking on dangerous bets.',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Chapter number where the character first appears',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  firstAppearanceChapter: number | null;

  @ApiPropertyOptional({
    description: 'Notable roles or positions',
    type: [String],
    example: ['Kakerou Company CEO', 'Professional Gambler'],
  })
  @Column({ type: 'simple-array', nullable: true })
  notableRoles: string[] | null;

  @ApiPropertyOptional({
    description: 'Notable games participated in',
    type: [String],
    example: ['17 Steps', 'One-Card Poker'],
  })
  @Column({ type: 'simple-array', nullable: true })
  notableGames: string[] | null;

  @ApiPropertyOptional({
    description: "Character's occupation or profession",
    example: 'Professional Gambler',
  })
  @Column({ type: 'varchar', nullable: true })
  occupation: string | null;

  @ApiPropertyOptional({
    description:
      'Organizations or groups the character is affiliated with (besides factions)',
    type: [String],
    example: ['Kakerou Company', 'Tournament Committee'],
  })
  @Column({ type: 'simple-array', nullable: true })
  affiliations: string[] | null;

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
    description: 'Main character image/portrait filename',
    example: 'baku-madarame-portrait.webp',
  })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  imageFileName: string | null;

  @ApiPropertyOptional({
    description: 'Display name for the character image',
    example: 'Baku Madarame - Official Portrait',
  })
  @Column({ type: 'varchar', nullable: true, length: 200 })
  imageDisplayName: string | null;

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
