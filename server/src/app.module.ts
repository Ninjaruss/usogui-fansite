import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { SeriesModule } from './modules/series/series.module';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { FactionsModule } from './modules/factions/factions.module';
import { TagsModule } from './modules/tags/tags.module';
import { VolumesModule } from './modules/volumes/volumes.module';
import { SearchModule } from './modules/search/search.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { GamblesModule } from './modules/gambles/gambles.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { MediaModule } from './modules/media/media.module';
import { GuidesModule } from './modules/guides/guides.module';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = getDatabaseConfig(configService);
        
        // Add safeguards for production
        if (configService.get('NODE_ENV') === 'production' && configService.get('ENABLE_SCHEMA_SYNC') === 'true') {
          const logger = new Logger('DatabaseConfig');
          logger.warn('WARNING: Schema synchronization is enabled in production environment!');
          logger.warn('This can cause data loss. Consider disabling ENABLE_SCHEMA_SYNC in production.');
        }
        
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    SeriesModule,
    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    FactionsModule,
    TagsModule, 
    VolumesModule,
    SearchModule,

    UsersModule, 
    AuthModule,
    TranslationsModule,
    GamblesModule,
    QuotesModule,
    MediaModule,
    GuidesModule,
  ],
})
export class AppModule {}
