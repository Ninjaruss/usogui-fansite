import { ApiProperty } from '@nestjs/swagger';
import { Quote } from '../../../entities/quote.entity';

export class QuotePopularityDto {
  @ApiProperty({
    description: 'The quote object with character details',
    type: () => Quote,
  })
  quote: Quote;

  @ApiProperty({
    description: 'Number of users who selected this quote as their favorite',
    example: 5,
  })
  userCount: number;
}
