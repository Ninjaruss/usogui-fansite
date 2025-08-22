import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TranslationsService } from './translations.service';
import type {
  TranslatableEntityType,
  TranslationEntity,
  BaseTranslationFields
} from '../../entities/translations/types';
import { Language } from '../../entities/translations';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('translations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get(':entityType/:entityId')
  async getTranslations(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('entityId') entityId: number,
    @Query('language') language?: Language
  ) {
    if (language) {
      return this.translationsService.getTranslation<TranslationEntity>(
        entityType,
        entityId,
        language
      );
    }
    return this.translationsService.getTranslations<TranslationEntity>(
      entityType,
      entityId
    );
  }

  @Post(':entityType/:entityId')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async createTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('entityId') entityId: number,
    @Body() data: { language: Language } & Partial<BaseTranslationFields>
  ) {
    return this.translationsService.createTranslation<TranslationEntity>(
      entityType,
      entityId,
      data.language,
      data
    );
  }

  @Put(':entityType/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async updateTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('id') id: number,
    @Body() data: Partial<BaseTranslationFields>
  ) {
    return this.translationsService.updateTranslation<TranslationEntity>(
      entityType,
      id,
      data
    );
  }

  @Delete(':entityType/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async deleteTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('id') id: number
  ) {
    await this.translationsService.deleteTranslation(entityType, id);
    return { message: 'Translation deleted successfully' };
  }
}
