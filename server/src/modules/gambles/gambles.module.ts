import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamblesController } from './gambles.controller';
import { GamblesService } from './gambles.service';
import { Gamble } from '../../entities/gamble.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { GambleFaction } from '../../entities/gamble-faction.entity';
import { GambleFactionMember } from '../../entities/gamble-faction-member.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gamble,
      Character,
      Chapter,
      GambleFaction,
      GambleFactionMember,
    ]),
    MediaModule,
  ],
  controllers: [GamblesController],
  providers: [GamblesService],
  exports: [GamblesService],
})
export class GamblesModule {}
