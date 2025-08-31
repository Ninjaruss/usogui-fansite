import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TranslationsService } from './translations.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';
import { TranslationQueryDto } from './dto/translation-query.dto';
import type {
  TranslatableEntityType,
  TranslationEntity,
  BaseTranslationFields,
} from '../../entities/translations/types';
import { Language } from '../../entities/translations';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('translations')
@Controller('translations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get(':entityType/:entityId')
  @ApiOperation({
    summary: 'Get translations for an entity',
    description:
      'Retrieve all translations for a specific entity, or filter by language. Public endpoint but requires authentication for data consistency.',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity to get translations for',
    enum: ['chapter', 'character', 'arc', 'event', 'gamble', 'faction', 'tag'],
    example: 'chapter',
  })
  @ApiParam({
    name: 'entityId',
    description: 'ID of the entity to get translations for',
    type: 'number',
    example: 1,
  })
  @ApiQuery({
    name: 'language',
    description: 'Optional language filter',
    enum: Language,
    required: false,
    example: Language.JA,
  })
  @ApiResponse({
    status: 200,
    description: 'Translations retrieved successfully',
    schema: {
      oneOf: [
        {
          type: 'array',
          description:
            'Array of all translations when no language filter is applied',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              language: {
                type: 'string',
                enum: Object.values(Language),
                example: 'ja',
              },
              name: { type: 'string', example: 'ウソウギ' },
              description: {
                type: 'string',
                example: '賭博の世界で生きる嘘喰いの物語',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        {
          type: 'object',
          description: 'Single translation when language filter is applied',
          properties: {
            id: { type: 'number', example: 1 },
            language: {
              type: 'string',
              enum: Object.values(Language),
              example: 'ja',
            },
            name: { type: 'string', example: 'ウソウギ' },
            description: {
              type: 'string',
              example: '賭博の世界で生きる嘘喰いの物語',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Entity not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Entity with id 1 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getTranslations(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query('language') language?: Language,
  ) {
    if (language) {
      return this.translationsService.getTranslation<TranslationEntity>(
        entityType,
        entityId,
        language,
      );
    }
    return this.translationsService.getTranslations<TranslationEntity>(
      entityType,
      entityId,
    );
  }

  @Post(':entityType/:entityId')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create translation',
    description:
      'Create a new translation for an entity. Requires moderator or admin privileges. Each entity can have multiple translations in different languages.',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity to create translation for',
    enum: ['chapter', 'character', 'arc', 'event', 'gamble', 'faction', 'tag'],
    example: 'chapter',
  })
  @ApiParam({
    name: 'entityId',
    description: 'ID of the entity to create translation for',
    type: 'number',
    example: 1,
  })
  @ApiBody({
    type: CreateTranslationDto,
    description:
      'Translation data. Fields available depend on the entity type.',
    examples: {
      'chapter-translation': {
        summary: 'Chapter translation example',
        value: {
          language: 'ja',
          name: 'ウソウギ',
          description: '賭博の世界で生きる嘘喰いの物語',
        },
      },
      'character-translation': {
        summary: 'Character translation example',
        value: {
          language: 'ja',
          name: '斑目獏',
          description: '主人公。天才的な賭博師',
          role: '主人公',
          significance: '物語の中心人物',
        },
      },
      'gamble-translation': {
        summary: 'Gamble translation example',
        value: {
          language: 'ja',
          name: 'プロトポロス',
          description: '石を使った命懸けの賭博ゲーム',
          rules: '石を取り除くゲーム。最後の石を取った者が負け。',
          winCondition: '相手に最後の石を取らせる',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Translation created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        language: {
          type: 'string',
          enum: Object.values(Language),
          example: 'ja',
        },
        name: { type: 'string', example: 'ウソウギ' },
        description: {
          type: 'string',
          example: '賭博の世界で生きる嘘喰いの物語',
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['language must be a valid enum value'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - moderator or admin role required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Entity not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Entity with id 1 not found',
        error: 'Not Found',
      },
    },
  })
  async createTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Body() data: CreateTranslationDto,
  ) {
    return this.translationsService.createTranslation<TranslationEntity>(
      entityType,
      entityId,
      data.language,
      data,
    );
  }

  @Put(':entityType/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update translation',
    description:
      'Update an existing translation. Requires moderator or admin privileges. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity the translation belongs to',
    enum: ['chapter', 'character', 'arc', 'event', 'gamble', 'faction', 'tag'],
    example: 'chapter',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the translation to update',
    type: 'number',
    example: 1,
  })
  @ApiBody({
    type: UpdateTranslationDto,
    description: 'Updated translation data. All fields are optional.',
    examples: {
      'partial-update': {
        summary: 'Partial update example',
        value: {
          name: 'ウソウギ - 新訳',
          description: '更新された説明文',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Translation updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        language: {
          type: 'string',
          enum: Object.values(Language),
          example: 'ja',
        },
        name: { type: 'string', example: 'ウソウギ - 新訳' },
        description: { type: 'string', example: '更新された説明文' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTranslationDto,
  ) {
    return this.translationsService.updateTranslation<TranslationEntity>(
      entityType,
      id,
      data,
    );
  }

  @Delete(':entityType/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete translation',
    description:
      'Delete a translation. Requires moderator or admin privileges. This action cannot be undone.',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity the translation belongs to',
    enum: ['chapter', 'character', 'arc', 'event', 'gamble', 'faction', 'tag'],
    example: 'chapter',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the translation to delete',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Translation deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Translation deleted successfully',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - moderator or admin role required',
  })
  @ApiNotFoundResponse({
    description: 'Translation not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Translation with id 1 not found',
        error: 'Not Found',
      },
    },
  })
  async deleteTranslation(
    @Param('entityType') entityType: TranslatableEntityType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.translationsService.deleteTranslation(entityType, id);
    return { message: 'Translation deleted successfully' };
  }

  @Get('languages')
  @ApiOperation({
    summary: 'Get available languages',
    description: 'Retrieve list of all supported languages for translations',
  })
  @ApiResponse({
    status: 200,
    description: 'Available languages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'ja' },
          name: { type: 'string', example: 'Japanese' },
          nativeName: { type: 'string', example: '日本語' },
        },
      },
      example: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async getAvailableLanguages() {
    return [
      { code: Language.EN, name: 'English', nativeName: 'English' },
      { code: Language.JA, name: 'Japanese', nativeName: '日本語' },
    ];
  }

  @Get('stats')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get translation statistics',
    description:
      'Retrieve statistics about translation coverage and progress. Requires moderator or admin privileges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Translation statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalEntities: { type: 'number', example: 150 },
        translatedEntities: {
          type: 'object',
          properties: {
            en: { type: 'number', example: 150 },
            ja: { type: 'number', example: 45 },
          },
        },
        coveragePercentage: {
          type: 'object',
          properties: {
            en: { type: 'number', example: 100 },
            ja: { type: 'number', example: 30 },
          },
        },
        byEntityType: {
          type: 'object',
          properties: {
            chapter: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 1 },
                translated: {
                  type: 'object',
                  properties: {
                    en: { type: 'number', example: 1 },
                    ja: { type: 'number', example: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - moderator or admin role required',
  })
  async getTranslationStats() {
    return this.translationsService.getTranslationStats();
  }
}
