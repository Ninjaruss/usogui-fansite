import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Character]), EditLogModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
