import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { Series } from './series.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Series])],
  providers: [SeriesService],
  controllers: [SeriesController],
})
export class SeriesModule {}
