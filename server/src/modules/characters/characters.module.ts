import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { Character } from '../../entities/character.entity';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character]), ServicesModule],
  providers: [CharactersService],
  controllers: [CharactersController],
})
export class CharactersModule {}
