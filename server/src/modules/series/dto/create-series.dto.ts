import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl, IsArray, IsNotEmpty } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the series' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Series description' })
  description?: string;

  @IsNumber()
  @ApiProperty({ description: 'Order in which the series should be displayed' })
  order: number;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({ description: 'URL to the official series website' })
  officialWebsite?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Alternative titles or names for the series',
    type: [String]
  })
  alternativeTitles?: string[];
}
