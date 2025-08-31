import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Character } from './character.entity';
import { User } from './user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['isActive'])
@Index(['character', 'isActive'])
export class ProfileImage {
  @ApiProperty({ description: 'Unique identifier of the profile image' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Display name for the profile image',
    example: 'Baku Madarame - Confident Smile',
  })
  @Column({ type: 'varchar' })
  displayName: string;

  @ApiProperty({
    description: 'File name/path of the image',
    example: 'baku-madarame-confident-v2.webp',
  })
  @Column({ type: 'varchar' })
  fileName: string;

  @ApiPropertyOptional({
    description: 'Optional description of the image/pose',
    example:
      'Baku with his signature confident expression during a high-stakes gamble',
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Character this image represents',
    example: 1,
  })
  @Column({ type: 'int' })
  characterId: number;

  @ApiProperty({
    description: 'Whether this image is currently available for selection',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Display order for sorting images',
    example: 1,
  })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Tags for categorizing images (e.g., expressions, outfits)',
    example: ['confident', 'smiling', 'formal'],
  })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @ApiProperty({
    description: 'Character this image represents',
    type: () => Character,
  })
  @ManyToOne(() => Character, { nullable: false })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ApiProperty({
    description: 'Users who have selected this as their profile image',
    type: () => [User],
  })
  @OneToMany(() => User, (user) => user.profileImage)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
