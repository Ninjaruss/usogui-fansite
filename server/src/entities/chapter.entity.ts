import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Chapter {
  @ApiProperty({ description: 'Unique identifier of the chapter' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Chapter number',
    example: 1,
  })
  @Column()
  number: number;

  @ApiPropertyOptional({
    description: 'Title of the chapter',
    example: 'The Beginning of Fate',
  })
  @Column({ nullable: true, length: 200 })
  title: string;

  @ApiPropertyOptional({
    description: "Brief summary of the chapter's content",
  })
  @Column({ type: 'text', nullable: true })
  summary: string;
}
