import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackblazeB2Service } from './backblaze-b2.service';

@Module({
  imports: [ConfigModule],
  providers: [BackblazeB2Service],
  exports: [BackblazeB2Service],
})
export class ServicesModule {}