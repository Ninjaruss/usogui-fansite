import { ApiProperty } from '@nestjs/swagger';
import { Gamble } from '../../../entities/gamble.entity';

export class GamblePopularityDto {
  @ApiProperty({
    description: 'The gamble object with chapter details',
    type: () => Gamble,
  })
  gamble: Gamble;

  @ApiProperty({
    description: 'Number of users who selected this gamble as their favorite',
    example: 3,
  })
  userCount: number;
}
