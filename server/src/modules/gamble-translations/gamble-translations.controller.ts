import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { GambleTranslationsService } from './gamble-translations.service';
import { CreateGambleTranslationDto } from './dto/create-gamble-translation.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('gamble-translations')
@Controller('gamble-translations')
export class GambleTranslationsController {
  constructor(private readonly service: GambleTranslationsService) {}

  @ApiOperation({ summary: 'Create a new gamble translation' })
  @Post()
  create(@Body() data: CreateGambleTranslationDto) {
    return this.service.create(data);
  }

  @ApiOperation({ summary: 'Get all translations for a gamble' })
  @ApiParam({ name: 'gambleId', description: 'ID of the gamble', type: 'number' })
  @Get('gamble/:gambleId')
  findByGambleId(@Param('gambleId') gambleId: number) {
    return this.service.findByGambleId(gambleId);
  }

  @ApiOperation({ summary: 'Get a specific translation for a gamble by language' })
  @ApiParam({ name: 'gambleId', description: 'ID of the gamble', type: 'number' })
  @ApiQuery({ name: 'language', description: 'Language code (e.g., "en", "ja")', type: 'string' })
  @Get('gamble/:gambleId/language')
  findByGambleIdAndLanguage(
    @Param('gambleId') gambleId: number,
    @Query('language') language: string
  ) {
    return this.service.findByGambleIdAndLanguage(gambleId, language);
  }

  @ApiOperation({ summary: 'Update a gamble translation' })
  @Put(':id')
  update(@Param('id') id: number, @Body() data: CreateGambleTranslationDto) {
    return this.service.update(id, data);
  }

  @ApiOperation({ summary: 'Delete a gamble translation' })
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
