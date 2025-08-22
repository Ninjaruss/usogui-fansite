import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { SeriesModule } from './modules/series/series.module';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { ChapterSpoilersModule } from './modules/chapter-spoilers/chapter-spoilers.module';
import { FactionsModule } from './modules/factions/factions.module';
import { TagsModule } from './modules/tags/tags.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { GamblesModule } from './modules/gambles/gambles.module';
import { GambleTranslationsModule } from './modules/gamble-translations/gamble-translations.module';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => 
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),

    SeriesModule,
    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    ChapterSpoilersModule,
    FactionsModule,
    TagsModule, 

    UsersModule, 
    AuthModule,
    TranslationsModule,
    GamblesModule,
    GambleTranslationsModule,
  ],
})
export class AppModule {}
