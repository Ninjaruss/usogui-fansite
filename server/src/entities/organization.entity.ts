import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CharacterOrganization } from './character-organization.entity';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity()
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
}
