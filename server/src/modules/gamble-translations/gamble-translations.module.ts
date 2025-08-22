import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GambleTranslation } from '../../entities/translations/gamble-translation.entity';
import { GambleTranslationsController } from './gamble-translations.controller';
import { GambleTranslationsService } from './gamble-translations.service';

@Module({
  imports: [TypeOrmModule.forFeature([GambleTranslation])],
  controllers: [GambleTranslationsController],
  providers: [GambleTranslationsService],
  exports: [GambleTranslationsService]
})
export class GambleTranslationsModule {}
