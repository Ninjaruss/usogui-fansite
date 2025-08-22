import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateArcDto {
  @IsString()
  @ApiProperty({ description: 'Name of the story arc' })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'Order of the arc in the series', default: 0 })
  order: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Description of the arc' })
  description?: string;

  @IsNumber()
  @ApiProperty({ description: 'ID of the series this arc belongs to' })
  seriesId: number;
}
