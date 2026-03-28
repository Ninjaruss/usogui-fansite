import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { Chapter } from '../../entities/chapter.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter]), EditLogModule],
  providers: [ChaptersService],
  controllers: [ChaptersController],
})
export class ChaptersModule {}
