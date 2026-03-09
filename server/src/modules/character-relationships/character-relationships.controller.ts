import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CharacterRelationshipsService } from './character-relationships.service';
import { RelationshipType } from '../../entities/character-relationship.entity';
import { CreateCharacterRelationshipDto } from './dto/create-character-relationship.dto';
import { UpdateCharacterRelationshipDto } from './dto/update-character-relationship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('character-relationships')
@Controller('character-relationships')
export class CharacterRelationshipsController {
  constructor(private readonly service: CharacterRelationshipsService) {}

  /**
   * Public endpoint: Get relationships for a character with spoiler protection
   */
  @Get('character/:characterId')
  @ApiOperation({
    summary: 'Get relationships for a character',
    description:
      'Retrieve all relationships for a character, filtered by reading progress for spoiler protection',
  })
  @ApiParam({
    name: 'characterId',
    description: 'Character ID',
    type: 'number',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress - only shows safe relationships",
  })
  @ApiQuery({
    name: 'grouped',
    required: false,
    description: 'If true, returns relationships grouped by type',
  })
  async getForCharacter(
    @Param('characterId', ParseIntPipe) characterId: number,
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('grouped') grouped?: string,
  ) {
    if (grouped === 'true') {
      return this.service.findForCharacterGrouped(characterId, userProgress);
    }
    return this.service.findForCharacter(characterId, userProgress);
  }

  /**
   * Admin endpoint: List all relationships
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all relationships (admin)',
    description: 'Retrieve all relationships with pagination and filtering',
  })
  @ApiQuery({
    name: 'sourceCharacterId',
    required: false,
    description: 'Filter by source character ID',
  })
  @ApiQuery({
    name: 'targetCharacterId',
    required: false,
    description: 'Filter by target character ID',
  })
  @ApiQuery({
    name: 'relationshipType',
    required: false,
    enum: RelationshipType,
    type: 'string',
    description: 'Filter by relationship type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  async getAll(
    @Query('sourceCharacterId', new ParseIntPipe({ optional: true }))
    sourceCharacterId?: number,
    @Query('targetCharacterId', new ParseIntPipe({ optional: true }))
    targetCharacterId?: number,
    @Query('relationshipType') relationshipType?: RelationshipType,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.service.findAll({
      sourceCharacterId,
      targetCharacterId,
      relationshipType,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    });
  }

  /**
   * Admin endpoint: Get a single relationship
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single relationship (admin)',
    description: 'Retrieve a single relationship by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Relationship ID',
    type: 'number',
  })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * Admin endpoint: Create a relationship
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a relationship (admin)',
    description: 'Create a new character relationship',
  })
  @ApiBody({ type: CreateCharacterRelationshipDto })
  async create(@Body(ValidationPipe) dto: CreateCharacterRelationshipDto) {
    const result = await this.service.create(dto);
    // If bidirectional relationship was created, return only the primary one
    // (React Admin expects a single object with an id field)
    if ('primary' in result) {
      return result.primary;
    }
    return result;
  }

  /**
   * Admin endpoint: Update a relationship
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a relationship (admin)',
    description: 'Update an existing character relationship',
  })
  @ApiParam({
    name: 'id',
    description: 'Relationship ID',
    type: 'number',
  })
  @ApiBody({ type: UpdateCharacterRelationshipDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateCharacterRelationshipDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * Admin endpoint: Delete a relationship
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a relationship (admin)',
    description: 'Delete a character relationship',
  })
  @ApiParam({
    name: 'id',
    description: 'Relationship ID',
    type: 'number',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
