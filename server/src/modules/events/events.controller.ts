import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
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
import { EventsService } from './events.service';
import { Event, EventType, EventStatus } from '../../entities/event.entity';
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
    description:
      'Retrieve a paginated list of events with optional filtering by title, arc, type, and spoiler protection',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by event title',
  })
  @ApiQuery({ name: 'arc', required: false, description: 'Filter by arc name' })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by description content',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: EventType,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress - only shows safe events",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter by approval status',
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
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: ASC)',
  })
  @ApiQuery({
    name: 'character',
    required: false,
    description: 'Filter by character name',
  })
  async getAll(
    @Query('title') title?: string,
    @Query('arc') arc?: string,
    @Query('description') description?: string,
    @Query('type') type?: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('status') status?: EventStatus,
    @Query('character') character?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ) {
    const result = await this.service.findAll({
      title,
      arc,
      description,
      type,
      character,
      userProgress,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    });

    return result;
  }

  @Get('by-arc/:arcId')
  @ApiOperation({
    summary: 'Get events by arc',
    description:
      'Retrieve all events for a specific arc with optional filtering',
  })
  @ApiParam({
    name: 'arcId',
    description: 'Arc ID to filter events',
    type: 'number',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by event title',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by description content',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: EventType,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress - only shows safe events",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter by approval status',
  })
  async getByArc(
    @Param('arcId', ParseIntPipe) arcId: number,
    @Query('title') title?: string,
    @Query('description') description?: string,
    @Query('type') type?: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('status') status?: EventStatus,
  ) {
    return await this.service.findByArc(arcId, {
      title,
      description,
      type,
      userProgress,
      status,
    });
  }

  @Get('by-chapter/:chapterNumber')
  @ApiOperation({
    summary: 'Get events by chapter',
    description:
      'Retrieve all events for a specific chapter with optional filtering',
  })
  @ApiParam({
    name: 'chapterNumber',
    description: 'Chapter number to filter events',
    type: 'number',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter by event title',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by description content',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: EventType,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress - only shows safe events",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter by approval status',
  })
  async getByChapter(
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @Query('title') title?: string,
    @Query('description') description?: string,
    @Query('type') type?: EventType,
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('status') status?: EventStatus,
  ) {
    return await this.service.findByChapter(chapterNumber, {
      title,
      description,
      type,
      userProgress,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single event',
    description: 'Retrieve a single event by its ID',
  })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
    const event = await this.service.findOne(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Create a new event (requires authentication)',
  })
  @ApiBody({ type: CreateEventDto })
  async create(@Body(ValidationPipe) createEventDto: CreateEventDto) {
    return await this.service.create(createEventDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an event',
    description: 'Update an existing event (requires admin/moderator role)',
  })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  @ApiBody({ type: UpdateEventDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateEventDto: UpdateEventDto,
  ) {
    return await this.service.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an event',
    description: 'Delete an event (requires admin role)',
  })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id);
  }

  @Get('grouped/by-arc')
  @ApiOperation({
    summary: 'Get events grouped by arc',
    description: 'Retrieve all events grouped by their story arcs',
  })
  @ApiQuery({
    name: 'userProgress',
    required: false,
    description: "User's reading progress - only shows safe events",
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: EventType,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter by approval status',
  })
  @ApiQuery({
    name: 'character',
    required: false,
    description: 'Filter by character name',
  })
  async getGroupedByArc(
    @Query('userProgress', new ParseIntPipe({ optional: true }))
    userProgress?: number,
    @Query('type') type?: EventType,
    @Query('status') status?: EventStatus,
    @Query('character') character?: string,
  ) {
    return await this.service.findGroupedByArc({
      userProgress,
      type,
      status,
      character,
    });
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve an event',
    description: 'Approve an event (requires admin/moderator role)',
  })
  @ApiParam({ name: 'id', description: 'Event ID', type: 'number' })
  async approve(@Param('id', ParseIntPipe) id: number) {
    await this.service.update(id, { status: EventStatus.APPROVED });
    return { message: 'Event approved successfully' };
  }
}
