import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChapterSpoilersService } from './chapter_spoilers.service';
import { ChapterSpoilersController } from './chapter_spoilers.controller';
import { ChapterSpoiler } from './chapter_spoiler.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterSpoiler])],
  providers: [ChapterSpoilersService],
  controllers: [ChapterSpoilersController],
})
export class ChapterSpoilersModule {}
