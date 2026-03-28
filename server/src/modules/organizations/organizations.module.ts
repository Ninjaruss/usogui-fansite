import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../../entities/organization.entity';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), MediaModule, EditLogModule],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
