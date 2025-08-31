import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from './translation-types';
import { ApiProperty } from '@nestjs/swagger';

// Base class for all translations
export abstract class BaseTranslation {
  @ApiProperty({ description: 'Unique identifier of the translation' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Language of the translation',
    enum: Language,
    default: Language.EN,
    example: Language.EN,
  })
  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @ApiProperty({
    description: 'Creation timestamp',
    type: Date,
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: Date,
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
