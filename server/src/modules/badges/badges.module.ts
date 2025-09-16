import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { Badge } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { User } from '../../entities/user.entity';
import { Donation } from '../../entities/donation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, User, Donation])],
  providers: [BadgesService],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {}
