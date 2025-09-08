import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { Guide } from '../../entities/guide.entity';
import { GuideLike } from '../../entities/guide-like.entity';
import { Tag } from '../../entities/tag.entity';
import { User } from '../../entities/user.entity';
import { Character } from '../../entities/character.entity';
import { Arc } from '../../entities/arc.entity';
import { Gamble } from '../../entities/gamble.entity';
import { PageViewsModule } from '../page-views/page-views.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guide, GuideLike, Tag, User, Character, Arc, Gamble]),
    PageViewsModule,
  ],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
