import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GambleFaction } from './gamble-faction.entity';
import { Character } from './character.entity';

export enum FactionMemberRole {
  LEADER = 'leader',
  MEMBER = 'member',
  SUPPORTER = 'supporter',
  OBSERVER = 'observer',
}

@Entity('gamble_faction_members')
@Index(['factionId'])
@Index(['characterId'])
export class GambleFactionMember {
  @ApiProperty({ description: 'Unique identifier of the faction member' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID of the faction this member belongs to' })
  @Column()
  factionId: number;

  @ManyToOne(() => GambleFaction, (faction) => faction.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factionId' })
  faction: GambleFaction;

  @ApiProperty({ description: 'ID of the character' })
  @Column()
  characterId: number;

  @ApiProperty({
    description: 'The character who is a member of this faction',
    type: () => Character,
  })
  @ManyToOne(() => Character, { eager: true })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ApiPropertyOptional({
    description: 'Role of this member in the faction',
    enum: FactionMemberRole,
    example: FactionMemberRole.MEMBER,
  })
  @Column({
    type: 'enum',
    enum: FactionMemberRole,
    nullable: true,
  })
  role: FactionMemberRole | null;

  @ApiPropertyOptional({
    description: 'Display order for this member within the faction',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;
}
