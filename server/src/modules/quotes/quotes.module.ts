import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Character])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
