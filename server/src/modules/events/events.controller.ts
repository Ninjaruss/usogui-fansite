import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event, EventType } from '../../entities/event.entity';
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
  description: 'Retrieve a paginated list of events with optional filtering by title, arc, type, and spoiler protection'
  })
  @ApiQuery({ name: 'title', required: false, description: 'Filter by event title' })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  @ApiQuery({ name: 'description', required: false, description: 'Filter by description content' })
  @ApiQuery({ name: 'type', required: false, enum: EventType, description: 'Filter by event type' })
  @ApiQuery({ name: 'userProgress', required: false, description: 'User\'s reading progress - only shows safe events' })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status' })
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
    @Query('description') description?: string,
    @Query('type') type?: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true })) userProgress?: number,
    @Query('isVerified') isVerifiedStr?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Event[]; total: number; page: number; totalPages: number }> {
    const isVerified = isVerifiedStr !== undefined ? isVerifiedStr === 'true' : undefined;
    return this.service.findAll({ 
      title, 
      arc, 
      description, 
      type,
      userProgress,
      isVerified,
      page: parseInt(page), 
      limit: parseInt(limit), 
      sort, 
      order 
    });
  }

  @Get('viewable/:userProgress')
  @ApiOperation({ 
    summary: 'Get all events viewable by user',
    description: 'Get all events that are safe for the user to view based on their reading progress'
  })
  @ApiParam({ name: 'userProgress', description: 'Highest chapter number the user has read' })
  @ApiQuery({ name: 'type', required: false, enum: EventType, description: 'Filter by event type' })
  @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verification status' })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Viewable events retrieved successfully',
    type: [Event]
  })
  getViewableEvents(
    @Param('userProgress', ParseIntPipe) userProgress: number,
    @Query('type') type?: EventType,
    @Query('isVerified') isVerifiedStr?: string,
    @Query('arc') arc?: string,
  ): Promise<Event[]> {
    const isVerified = isVerifiedStr !== undefined ? isVerifiedStr === 'true' : undefined;
  return this.service.findViewableEvents(userProgress, { type, isVerified, arc });
  }

  @Post('check-viewable')
  @ApiOperation({
    summary: 'Check if user can view an event',
    description: 'Determines if a user can view a specific event based on their reading progress'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventId: { type: 'number', example: 1 },
        userProgress: { type: 'number', example: 15 }
      },
      required: ['eventId', 'userProgress']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Event viewability determined',
    schema: {
      example: { viewable: true }
    }
  })
  async checkEventViewable(
    @Body('eventId', ParseIntPipe) eventId: number,
    @Body('userProgress', ParseIntPipe) userProgress: number,
  ): Promise<{ viewable: boolean }> {
    const viewable = await this.service.canViewEvent(eventId, userProgress);
    return { viewable };
  }

  @Get('type/:type')
  @ApiOperation({
    summary: 'Get events by type',
    description: 'Retrieve all events of a specific type with optional spoiler protection'
  })
  @ApiParam({ name: 'type', enum: EventType, description: 'Event type' })
  @ApiQuery({ name: 'userProgress', required: false, description: 'User\'s reading progress for spoiler protection' })
  @ApiResponse({ 
    status: 200, 
    description: 'Events retrieved successfully',
    type: [Event]
  })
  getEventsByType(
    @Param('type') type: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true })) userProgress?: number,
  ): Promise<Event[]> {
    return this.service.findByType(type, userProgress);
  }

  @Get('chapter/:chapterNumber')
  @ApiOperation({
    summary: 'Get events occurring in a specific chapter',
    description: 'Retrieve all events that occur during a specific chapter with optional spoiler protection'
  })
  @ApiParam({ name: 'chapterNumber', description: 'Chapter number' })
  @ApiQuery({ name: 'userProgress', required: false, description: 'User\'s reading progress for spoiler protection' })
  @ApiResponse({ 
    status: 200, 
    description: 'Chapter events retrieved successfully',
    type: [Event]
  })
  getEventsByChapter(
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Query('userProgress', new ParseIntPipe({ optional: true })) userProgress?: number,
  ): Promise<Event[]> {
    return this.service.getEventsByChapter(chapterNumber, userProgress);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search events by text',
    description: 'Search for events containing specific text in title or description'
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'type', required: false, enum: EventType, description: 'Filter by event type' })
  @ApiQuery({ name: 'userProgress', required: false, description: 'User\'s reading progress for spoiler protection' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: [Event]
  })
  searchEvents(
    @Query('q') searchTerm: string,
    @Query('type') type?: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true })) userProgress?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<Event[]> {
    return this.service.searchEvents(searchTerm, { type, userProgress, limit });
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
    type: Event
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  create(@Body(ValidationPipe) createEventDto: CreateEventDto): Promise<Event> {
    return this.service.create(createEventDto);
  }

  @Put(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify an event',
    description: 'Mark an event as verified by moderators/admins'
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event verified successfully',
    type: Event
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires moderator or admin role' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async verify(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const result = await this.service.update(id, { isVerified: true });
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Event verified successfully' };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update event',
    description: 'Update an existing event (requires moderator or admin role)'
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1 })
  @ApiBody({ type: UpdateEventDto })
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
  async update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) data: UpdateEventDto) {
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }
}
