import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterSpoilersService } from './chapter-spoilers.service';
import { ChapterSpoilersController } from './chapter-spoilers.controller';
import { ChapterSpoiler } from '../../entities/chapter_spoiler.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Event } from '../../entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterSpoiler, Chapter, Event])],
  providers: [ChapterSpoilersService],
  controllers: [ChapterSpoilersController],
})
export class ChapterSpoilersModule {}
