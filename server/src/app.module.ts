import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { ArcsModule } from './modules/arcs/arcs.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { EventsModule } from './modules/events/events.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
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
import { PageViewsModule } from './modules/page-views/page-views.module';
import { BadgesModule } from './modules/badges/badges.module';
import { DonationsModule } from './modules/donations/donations.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AppController } from './app.controller';
import { Guide } from './entities/guide.entity';
import { Character } from './entities/character.entity';
import { Event } from './entities/event.entity';
import { Gamble } from './entities/gamble.entity';
import { Arc } from './entities/arc.entity';
import { Media } from './entities/media.entity';
import { User } from './entities/user.entity';
import { Logger } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = getDatabaseConfig(configService);

        // Add safeguards for production
        if (
          configService.get('NODE_ENV') === 'production' &&
          configService.get('ENABLE_SCHEMA_SYNC') === 'true'
        ) {
          const logger = new Logger('DatabaseConfig');
          logger.warn(
            'WARNING: Schema synchronization is enabled in production environment!',
          );
          logger.warn(
            'This can cause data loss. Consider disabling ENABLE_SCHEMA_SYNC in production.',
          );
        }

        return dbConfig;
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([
      Guide,
      Character,
      Event,
      Gamble,
      Arc,
      Media,
      User,
    ]),

    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    OrganizationsModule,
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
    PageViewsModule,
    BadgesModule,
    DonationsModule,
    TasksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
