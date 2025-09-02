import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Character } from './character.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity()
export class Faction {
  @ApiProperty({ description: 'Unique identifier of the faction' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the faction',
    example: 'IDEAL',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the faction',
    example: 'A powerful organization that...',
  })
  @Column({ nullable: true })
  description: string;

  @ApiHideProperty()
  @ManyToMany(() => Character, (character) => character.factions)
  @JoinTable()
  characters: Character[];
}
