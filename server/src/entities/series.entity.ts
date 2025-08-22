import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Series {
  @ApiProperty({ description: 'Unique identifier of the series' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: 'Name of the series',
    example: 'Usogui'
  })
  @Column()
  name: string;

  @ApiProperty({ 
    description: 'Order in which this series should be read',
    example: 1,
    default: 0
  })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiPropertyOptional({ 
    description: 'Detailed description of the series',
    example: 'A dark psychological gambling manga...'
  })
  @Column({ type: 'text', nullable: true })
  description: string;
}
