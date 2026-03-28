import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterOrganization } from '../../entities/character-organization.entity';
import { Character } from '../../entities/character.entity';
import { Organization } from '../../entities/organization.entity';
import { CharacterOrganizationsService } from './character-organizations.service';
import { CharacterOrganizationsController } from './character-organizations.controller';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CharacterOrganization, Character, Organization]),
    EditLogModule,
  ],
  providers: [CharacterOrganizationsService],
  controllers: [CharacterOrganizationsController],
  exports: [CharacterOrganizationsService],
})
export class CharacterOrganizationsModule {}
