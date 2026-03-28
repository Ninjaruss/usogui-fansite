import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Organization } from '../../entities/organization.entity';
import { ServicesModule } from '../../services/services.module';
import { PageViewsModule } from '../page-views/page-views.module';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, Gamble, Organization]),
    ServicesModule,
    PageViewsModule,
    MediaModule,
    EditLogModule,
  ],
  providers: [CharactersService],
  controllers: [CharactersController],
})
export class CharactersModule {}
