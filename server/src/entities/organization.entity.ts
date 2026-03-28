import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CharacterOrganization } from './character-organization.entity';
import { User } from './user.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity()
@Index(['name'])
export class Organization {
  @ApiProperty({ description: 'Unique identifier of the organization' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Name of the organization',
    example: 'IDEAL',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the organization',
    example: 'A powerful organization that...',
  })
  @Column({ nullable: true })
  description: string;

  @ApiHideProperty()
  @OneToMany(() => CharacterOrganization, (co) => co.organization)
  characterMemberships: CharacterOrganization[];

  @ApiProperty({ description: 'Whether this organization page has been verified by a moderator' })
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
}
