import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Volume {
  @ApiProperty({ description: 'Unique identifier of the volume' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
  description: 'Volume number',
    example: 1
  })
  @Column()
  number: number;

  @ApiPropertyOptional({ 
    description: 'URL to the volume cover image',
    example: 'https://example.com/covers/volume1.jpg'
  })
  @Column({ nullable: true, length: 500 })
  coverUrl: string;

  @ApiProperty({ 
    description: 'First chapter number included in this volume',
    example: 1
  })
  @Column()
  startChapter: number;

  @ApiProperty({ 
    description: 'Last chapter number included in this volume',
    example: 10
  })
  @Column()
  endChapter: number;

  @ApiPropertyOptional({ 
    description: 'Brief description of the volume\'s content'
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'When the volume was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the volume was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
