import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGuideDto } from './create-guide.dto';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGuideDto extends PartialType(CreateGuideDto) {
  @ApiPropertyOptional({
    description: 'Author ID (admin only)',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  authorId?: number;

  @ApiPropertyOptional({
    description: 'Reason for rejection (moderator/admin only)',
    example: 'Guide content does not meet quality standards',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejectionReason?: string;
}
