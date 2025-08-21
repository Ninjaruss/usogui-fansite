import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeriesModule } from './series/series.module';
import { ArcsModule } from './arcs/arcs.module';
import { CharactersModule } from './characters/characters.module';
import { ChaptersModule } from './chapters/chapters.module';
import { EventsModule } from './events/events.module';
import { ChapterSpoilersModule } from './chapter_spoilers/chapter_spoilers.module'; // updated
import { UsersModule } from './users/users.module';
import { FactionsModule } from './factions/factions.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'ninjaruss',      // your macOS/PostgreSQL user
      password: 'your_password',
      database: 'usogui_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    SeriesModule,
    ArcsModule,
    CharactersModule,
    ChaptersModule,
    EventsModule,
    ChapterSpoilersModule,
    UsersModule,
    FactionsModule,
    TagsModule,       // updated
  ],
})
export class AppModule {}
