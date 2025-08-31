import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGuideDto } from './create-guide.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateGuideDto extends PartialType(CreateGuideDto) {
  @ApiPropertyOptional({
    description: 'Author ID (admin only)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  authorId?: number;
}
