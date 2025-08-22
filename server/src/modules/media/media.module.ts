// media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../entities/media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { EmailModule } from '../email/email.module';
import { UrlNormalizerService } from './services/url-normalizer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    EmailModule,
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
