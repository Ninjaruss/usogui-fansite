import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Gamble]), ServicesModule],
  providers: [CharactersService],
  controllers: [CharactersController],
})
export class CharactersModule {}
