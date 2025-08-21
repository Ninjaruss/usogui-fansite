import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcsService } from './arcs.service';
import { ArcsController } from './arcs.controller';
import { Arc } from './arc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Arc])],
  providers: [ArcsService],
  controllers: [ArcsController],
})
export class ArcsModule {}
