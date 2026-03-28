import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcsService } from './arcs.service';
import { ArcsController } from './arcs.controller';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Gamble } from '../../entities/gamble.entity';
import { ServicesModule } from '../../services/services.module';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Arc, Chapter, Gamble]),
    ServicesModule,
    MediaModule,
    EditLogModule,
  ],
  providers: [ArcsService],
  controllers: [ArcsController],
})
export class ArcsModule {}
