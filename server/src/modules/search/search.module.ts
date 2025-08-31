import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Chapter } from '../../entities/chapter.entity';
import { Character } from '../../entities/character.entity';
import { Event } from '../../entities/event.entity';
import { Arc } from '../../entities/arc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Character, Event, Arc])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
