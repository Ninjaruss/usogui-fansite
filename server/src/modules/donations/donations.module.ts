import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { Donation } from '../../entities/donation.entity';
import { User } from '../../entities/user.entity';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [TypeOrmModule.forFeature([Donation, User]), BadgesModule],
  providers: [DonationsService],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}
