import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolumesController } from './volumes.controller';
import { VolumesService } from './volumes.service';
import { Volume } from '../../entities/volume.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Volume]), MediaModule],
  controllers: [VolumesController],
  providers: [VolumesService],
  exports: [VolumesService],
})
export class VolumesModule {}
