import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  UseGuards,
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
import { OrganizationsService } from './organizations.service';
import { Organization } from '../../entities/organization.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private service: OrganizationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all organizations',
    description: 'Retrieve all organizations with optional filtering and sorting',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by organization name',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort field (id, name)',
    enum: ['id', 'name'],
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of organizations per page',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of organizations',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Organization' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        perPage: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  async findAll(
    @Query('name') name?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({
      name,
      sort,
      order,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get organization by ID',
    description: 'Retrieve a specific organization by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Organization ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Organization found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Kakerou' },
        description: {
          type: 'string',
          example: 'Underground gambling organization',
        },
        characters: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getOne(@Param('id') id: number): Promise<Organization> {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Create a new organization (requires moderator or admin role)',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'New Organization' },
        description: {
          type: 'string',
          example: 'A powerful organization that...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Validation failed' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  create(@Body() data: CreateOrganizationDto): Promise<Organization> {
    return this.service.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update organization',
    description:
      'Update an existing organization (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Organization ID', example: 1 })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Updated Organization' },
        description: {
          type: 'string',
          example: 'An updated powerful organization that...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Validation failed' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(@Param('id') id: number, @Body() data: UpdateOrganizationDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete organization',
    description: 'Delete a organization (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Organization ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Organization deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Organization not found' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
