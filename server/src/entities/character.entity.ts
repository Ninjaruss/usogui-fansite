import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quote } from './quote.entity';
import { CharacterOrganization } from './character-organization.entity';
import { User } from './user.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

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
    description:
      'Character backstory - detailed history and background information',
    example:
      'Born into a family of gamblers, Baku learned the art of deception at an early age...',
  })
  @Column({ type: 'text', nullable: true })
  backstory: string | null;

  @ApiPropertyOptional({
    description: 'Chapter number where the character first appears',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  firstAppearanceChapter: number | null;

  // Media relationships are now handled polymorphically through the Media entity
  // with ownerType='character' and ownerId=character.id

  @ApiPropertyOptional({
    description: 'Organization memberships with roles and timeline',
    type: () => [CharacterOrganization],
  })
  @OneToMany(() => CharacterOrganization, (co) => co.character)
  organizationMemberships: CharacterOrganization[];

  @ApiProperty({ description: 'Whether this character page has been verified by a moderator' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'ID of the moderator who last verified this page' })
  @Column({ nullable: true })
  verifiedById: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User;

  @ApiPropertyOptional({ description: 'When this page was last verified' })
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ApiHideProperty()
  @OneToMany(() => Quote, (quote) => quote.character, {
    nullable: true,
    cascade: true,
  })
  quotes: Quote[];
}
