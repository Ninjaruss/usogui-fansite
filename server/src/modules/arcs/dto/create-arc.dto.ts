import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, MinLength, MaxLength, Min } from 'class-validator';

export class CreateArcDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @ApiProperty({ 
    description: 'Name of the story arc',
    example: '17 Steps Tournament Arc'
  })
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({ 
    description: 'Order of the arc in the series',
    default: 0,
    example: 1
  })
  order: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  @ApiPropertyOptional({ 
    description: 'Description of the arc',
    example: 'A high-stakes tournament arc where participants must climb 17 steps...'
  })
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ 
    description: 'ID of the series this arc belongs to',
    example: 1
  })
  seriesId: number;
}
