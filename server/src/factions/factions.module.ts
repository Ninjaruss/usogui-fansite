import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactionsService } from './factions.service';
import { FactionsController } from './factions.controller';
import { Faction } from './faction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faction])],
  providers: [FactionsService],
  controllers: [FactionsController],
  exports: [FactionsService],
})
export class FactionsModule {}
