import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Series } from './series.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
@Index(['series'])
@Index(['number'])
export class Volume {
  @ApiProperty({ description: 'Unique identifier of the volume' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Volume number in the series',
    example: 1
  })
  @Column()
  number: number;

  @ApiPropertyOptional({ 
    description: 'Title of the volume',
    example: 'The Beginning'
  })
  @Column({ nullable: true, length: 200 })
  title: string;

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

  @ApiProperty({ 
    description: 'Series this volume belongs to',
    type: () => Series
  })
  @ManyToOne(() => Series, series => series.volumes, {
    onDelete: 'CASCADE'
  })
  series: Series;

  @ApiProperty({ description: 'ID of the series this volume belongs to' })
  @Column()
  seriesId: number;

  @ApiProperty({ description: 'When the volume was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the volume was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
