// media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../entities/media.entity';
import { Character } from '../../entities/character.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { EmailModule } from '../email/email.module';
import { UrlNormalizerService } from './services/url-normalizer.service';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Media, Character]), EmailModule, ServicesModule],
  providers: [MediaService, UrlNormalizerService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
