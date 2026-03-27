import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditLog } from '../../entities/edit-log.entity';
import { Guide } from '../../entities/guide.entity';
import { Media } from '../../entities/media.entity';
import { Annotation } from '../../entities/annotation.entity';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Arc } from '../../entities/arc.entity';
import { Organization } from '../../entities/organization.entity';
import { Event } from '../../entities/event.entity';
import { Chapter } from '../../entities/chapter.entity';
import { EditLogService } from './edit-log.service';
import { EditLogController } from './edit-log.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EditLog,
      Guide,
      Media,
      Annotation,
      Character,
      Gamble,
      Arc,
      Organization,
      Event,
      Chapter,
    ]),
  ],
  controllers: [EditLogController],
  providers: [EditLogService],
  exports: [EditLogService],
})
export class EditLogModule {}
