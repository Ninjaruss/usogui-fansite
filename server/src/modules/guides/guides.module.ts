import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { Guide } from '../../entities/guide.entity';
import { GuideLike } from '../../entities/guide-like.entity';
import { Tag } from '../../entities/tag.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guide, GuideLike, Tag, User])],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
