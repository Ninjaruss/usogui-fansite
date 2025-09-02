import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { Gamble } from './gamble.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity()
export class GambleCharacter {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The gamble this character participated in',
    type: () => Gamble,
  })
  @ManyToOne(() => Gamble, (gamble) => gamble.participants, {
    onDelete: 'CASCADE',
  })
  gamble: Gamble;

  @ApiProperty({ description: 'ID of the character who participated' })
  @Column()
  characterId: number;

  @ApiHideProperty()
  @ManyToOne(() => Character, { eager: true })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ApiPropertyOptional({
    description: 'Team name if this gamble uses teams',
    example: 'Team Baku',
  })
  @Column({ nullable: true })
  teamName?: string;

  @ApiProperty({
    description: 'Whether this character won the gamble',
    default: false,
  })
  @Column({ default: false })
  isWinner: boolean;

  @ApiPropertyOptional({
    description: 'What this character/team staked in the gamble',
    example: '100 million yen, right hand',
  })
  @Column({ nullable: true, type: 'text' })
  stake?: string;
}
