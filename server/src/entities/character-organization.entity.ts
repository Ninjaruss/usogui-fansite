import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Character } from './character.entity';
import { Organization } from './organization.entity';

/**
 * Represents a character's membership in an organization.
 * Tracks the role, timeline, and spoiler protection for organization memberships.
 * A character can have multiple entries for the same organization (for role changes).
 */
@Entity()
@Index(['characterId'])
@Index(['organizationId'])
@Index(['spoilerChapter'])
@Check('"endChapter" IS NULL OR "endChapter" >= "startChapter"')
export class CharacterOrganization {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The character who belongs to this organization',
    type: () => Character,
  })
  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ApiProperty({ description: 'ID of the character' })
  @Column()
  characterId: number;

  @ApiProperty({
    description: 'The organization the character belongs to',
    type: () => Organization,
  })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ApiProperty({ description: 'ID of the organization' })
  @Column()
  organizationId: number;

  @ApiProperty({
    description: 'The role/position of the character in the organization',
    example: 'Leader',
  })
  @Column({ type: 'varchar', length: 100 })
  role: string;

  @ApiProperty({
    description: 'Chapter number where this membership/role begins',
    example: 50,
  })
  @Column()
  startChapter: number;

  @ApiPropertyOptional({
    description:
      'Chapter number where this membership/role ends (null if ongoing)',
    example: 200,
  })
  @Column({ type: 'int', nullable: true })
  endChapter: number | null;

  @ApiProperty({
    description:
      'Chapter the user should have read before seeing this membership (spoiler protection)',
    example: 50,
  })
  @Column()
  spoilerChapter: number;

  @ApiPropertyOptional({
    description: 'Additional notes about this membership',
    example: 'Joined after winning the entrance gamble',
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'When this record was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When this record was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
