import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all events',
    description: 'Retrieve a paginated list of events with optional filtering by title, arc, series, and description'
  })
  @ApiQuery({ name: 'title', required: false, description: 'Filter by event title' })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  @ApiQuery({ name: 'series', required: false, description: 'Filter by series name' })
  @ApiQuery({ name: 'description', required: false, description: 'Filter by description content' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'The 17 Steps Tournament' },
              description: { type: 'string', example: 'A high-stakes tournament where participants must climb 17 steps...' },
              startChapter: { type: 'number', example: 45 },
              endChapter: { type: 'number', example: 52 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 30 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 2 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Query('title') title?: string,
    @Query('arc') arc?: string,
    @Query('series') series?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Event[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({ title, arc, series, description, page: parseInt(page), limit: parseInt(limit), sort, order });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieve a specific event by its unique identifier'
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Event found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'The 17 Steps Tournament' },
        description: { type: 'string', example: 'A high-stakes tournament where participants must climb 17 steps...' },
        startChapter: { type: 'number', example: 45 },
        endChapter: { type: 'number', example: 52 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getOne(@Param('id') id: number): Promise<Event> {
    const event = await this.service.findOne(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Create a new event (requires moderator or admin role)'
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        title: { type: 'string', example: 'Air Poker Tournament' },
        description: { type: 'string', example: 'A high-stakes poker game with deadly consequences' },
        startChapter: { type: 'number', example: 75 },
        endChapter: { type: 'number', example: 85 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body() createEventDto: CreateEventDto) {
    return this.service.create(createEventDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update event',
    description: 'Update an existing event (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1 })
  @ApiBody({
    description: 'Updated event data',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Tower of Karma Arc Begins' },
        description: { type: 'string', example: 'Updated description of the Tower of Karma arc' },
        startChapter: { type: 'number', example: 150 },
        endChapter: { type: 'number', example: 210 }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() data: UpdateEventDto) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete event',
    description: 'Delete an event (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
