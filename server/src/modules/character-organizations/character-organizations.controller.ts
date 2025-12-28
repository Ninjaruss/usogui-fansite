import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CharacterOrganizationsService } from './character-organizations.service';
import { CreateCharacterOrganizationDto } from './dto/create-character-organization.dto';
import { UpdateCharacterOrganizationDto } from './dto/update-character-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CharacterOrganization } from '../../entities/character-organization.entity';

@ApiTags('character-organizations')
@Controller('character-organizations')
export class CharacterOrganizationsController {
  constructor(private readonly service: CharacterOrganizationsService) {}

  /**
   * Public endpoint: Get all character-organization memberships
   */
  @Get()
  @ApiOperation({
    summary: 'Get all character-organization memberships',
    description:
      'Retrieve all memberships with optional filtering by character, organization, or user progress',
  })
  @ApiQuery({
    name: 'characterId',
    required: false,
    type: Number,
    description: 'Filter by character ID',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: Number,
    description: 'Filter by organization ID',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    type: Number,
    description: 'User reading progress for spoiler protection',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 25)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of character-organization memberships',
    type: [CharacterOrganization],
  })
  async findAll(
    @Query('characterId') characterId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userProgress') userProgress?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      characterId: characterId ? parseInt(characterId, 10) : undefined,
      organizationId: organizationId ? parseInt(organizationId, 10) : undefined,
      userProgress: userProgress ? parseInt(userProgress, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  /**
   * Public endpoint: Get memberships for a specific character
   */
  @Get('character/:characterId')
  @ApiOperation({
    summary: 'Get organization memberships for a character',
    description:
      'Retrieve all organization memberships for a specific character',
  })
  @ApiParam({ name: 'characterId', type: Number })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    type: Number,
    description: 'User reading progress for spoiler protection',
  })
  @ApiResponse({
    status: 200,
    description: 'List of organization memberships for the character',
    type: [CharacterOrganization],
  })
  async findForCharacter(
    @Param('characterId', ParseIntPipe) characterId: number,
    @Query('userProgress') userProgress?: string,
  ) {
    return this.service.findForCharacter(
      characterId,
      userProgress ? parseInt(userProgress, 10) : undefined,
    );
  }

  /**
   * Public endpoint: Get members for a specific organization
   */
  @Get('organization/:organizationId')
  @ApiOperation({
    summary: 'Get character members for an organization',
    description: 'Retrieve all character members for a specific organization',
  })
  @ApiParam({ name: 'organizationId', type: Number })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    type: Number,
    description: 'User reading progress for spoiler protection',
  })
  @ApiResponse({
    status: 200,
    description: 'List of character members for the organization',
    type: [CharacterOrganization],
  })
  async findForOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query('userProgress') userProgress?: string,
  ) {
    return this.service.findForOrganization(
      organizationId,
      userProgress ? parseInt(userProgress, 10) : undefined,
    );
  }

  /**
   * Public endpoint: Get a single membership by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific membership by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The membership record',
    type: CharacterOrganization,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * Admin endpoint: Create a new membership
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new character-organization membership' })
  @ApiResponse({
    status: 201,
    description: 'The created membership',
    type: CharacterOrganization,
  })
  async create(@Body() dto: CreateCharacterOrganizationDto) {
    return this.service.create(dto);
  }

  /**
   * Admin endpoint: Update a membership
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing membership' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The updated membership',
    type: CharacterOrganization,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCharacterOrganizationDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * Admin endpoint: Delete a membership
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a membership' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Membership deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { message: 'Membership deleted successfully' };
  }
}
