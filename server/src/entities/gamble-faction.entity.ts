import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gamble } from './gamble.entity';
import { Character } from './character.entity';
import { GambleFactionMember } from './gamble-faction-member.entity';

@Entity('gamble_factions')
@Index(['gambleId'])
export class GambleFaction {
  @ApiProperty({ description: 'Unique identifier of the faction' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ID of the gamble this faction belongs to' })
  @Column()
  gambleId: number;

  @ManyToOne(() => Gamble, (gamble) => gamble.factions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gambleId' })
  gamble: Gamble;

  @ApiPropertyOptional({
    description: 'Custom name for this faction (e.g., "Kakerou", "L\'air")',
    example: 'Kakerou',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @ApiPropertyOptional({
    description: 'ID of the main gambler this faction supports',
    example: 1,
  })
  @Column({ type: 'int', nullable: true })
  supportedGamblerId: number | null;

  @ApiPropertyOptional({
    description: 'The primary gambler this faction supports',
    type: () => Character,
  })
  @ManyToOne(() => Character, { nullable: true, eager: true })
  @JoinColumn({ name: 'supportedGamblerId' })
  supportedGambler: Character | null;

  @ApiProperty({
    description: 'Members of this faction',
    type: () => [GambleFactionMember],
  })
  @OneToMany(() => GambleFactionMember, (member) => member.faction, {
    cascade: true,
    eager: true,
  })
  members: GambleFactionMember[];

  @ApiPropertyOptional({
    description: 'Display order for this faction (lower numbers first)',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  displayOrder: number;
}
