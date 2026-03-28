import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { AnnotationQueryDto } from './dto/annotation-query.dto';
import { RejectAnnotationDto } from './dto/reject-annotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { AnnotationOwnerType } from '../../entities/annotation.entity';

@ApiTags('annotations')
@Controller('annotations')
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  // Public endpoints for getting approved annotations by owner type
  @Get('character/:characterId')
  @ApiOperation({
    summary: 'Get approved annotations for a character',
    description: 'Retrieves all approved annotations for a specific character.',
  })
  @ApiParam({ name: 'characterId', description: 'Character ID' })
  @ApiOkResponse({ description: 'Annotations retrieved successfully' })
  async getAnnotationsForCharacter(
    @Param('characterId', ParseIntPipe) characterId: number,
  ) {
    return await this.annotationsService.findApprovedByOwner(
      AnnotationOwnerType.CHARACTER,
      characterId,
    );
  }

  @Get('gamble/:gambleId')
  @ApiOperation({
    summary: 'Get approved annotations for a gamble',
    description: 'Retrieves all approved annotations for a specific gamble.',
  })
  @ApiParam({ name: 'gambleId', description: 'Gamble ID' })
  @ApiOkResponse({ description: 'Annotations retrieved successfully' })
  async getAnnotationsForGamble(
    @Param('gambleId', ParseIntPipe) gambleId: number,
  ) {
    return await this.annotationsService.findApprovedByOwner(
      AnnotationOwnerType.GAMBLE,
      gambleId,
    );
  }

  @Get('chapter/:chapterId')
  @ApiOperation({
    summary: 'Get approved annotations for a chapter',
    description:
      'Retrieves all approved annotations that reference a specific chapter.',
  })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  @ApiOkResponse({ description: 'Annotations retrieved successfully' })
  async getAnnotationsForChapter(
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    return await this.annotationsService.findApprovedByChapterReference(
      chapterId,
    );
  }

  @Get('arc/:arcId')
  @ApiOperation({
    summary: 'Get approved annotations for an arc',
    description: 'Retrieves all approved annotations for a specific arc.',
  })
  @ApiParam({ name: 'arcId', description: 'Arc ID' })
  @ApiOkResponse({ description: 'Annotations retrieved successfully' })
  async getAnnotationsForArc(@Param('arcId', ParseIntPipe) arcId: number) {
    return await this.annotationsService.findApprovedByOwner(
      AnnotationOwnerType.ARC,
      arcId,
    );
  }

  // User's own annotations
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user's annotations",
    description: 'Retrieves all annotations submitted by the current user.',
  })
  @ApiOkResponse({ description: 'User annotations retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async getMyAnnotations(@CurrentUser() user: User) {
    return await this.annotationsService.findByAuthor(user.id);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get one of the current user's annotations by ID",
    description:
      'Fetches a single annotation belonging to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiOkResponse({ description: 'Annotation retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiNotFoundResponse({
    description: 'Annotation not found or not owned by user',
  })
  async getMyAnnotation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.findMyOne(id, user.id);
  }

  // Create annotation
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new annotation',
    description:
      'Creates a new annotation. The annotation will be set to pending status for moderator approval.',
  })
  @ApiBody({ type: CreateAnnotationDto })
  @ApiCreatedResponse({ description: 'Annotation created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async create(
    @Body() createAnnotationDto: CreateAnnotationDto,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.create(createAnnotationDto, user);
  }

  // Update annotation
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an annotation',
    description:
      'Updates an existing annotation. Regular users can only update their own pending annotations.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiBody({ type: UpdateAnnotationDto })
  @ApiOkResponse({ description: 'Annotation updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'Not authorized to update this annotation',
  })
  @ApiNotFoundResponse({ description: 'Annotation not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnotationDto: UpdateAnnotationDto,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.update(id, updateAnnotationDto, user);
  }

  // Delete annotation
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an annotation',
    description:
      'Deletes an annotation. Users can delete their own annotations, admins/mods can delete any.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiNoContentResponse({ description: 'Annotation deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'Not authorized to delete this annotation',
  })
  @ApiNotFoundResponse({ description: 'Annotation not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.annotationsService.remove(id, user);
  }

  // Admin/mod endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all annotations (admin)',
    description:
      'Retrieves all annotations with filtering options. Admin/moderator only.',
  })
  @ApiOkResponse({ description: 'Annotations retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  async findAll(@Query() query: AnnotationQueryDto) {
    return await this.annotationsService.findAll(query);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending annotations',
    description:
      'Retrieves all pending annotations for moderation. Admin/moderator only.',
  })
  @ApiOkResponse({ description: 'Pending annotations retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  async findPending(@Query() query: AnnotationQueryDto) {
    return await this.annotationsService.findPending(query);
  }

  @Get('pending/count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending annotations count',
    description:
      'Returns the number of pending annotations. Admin/moderator only.',
  })
  @ApiOkResponse({ description: 'Count retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  async getPendingCount() {
    const count = await this.annotationsService.getPendingCount();
    return { count };
  }

  // Get single annotation (with visibility check)
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get a single annotation',
    description:
      'Retrieves a single annotation by ID. Non-approved annotations are only visible to author/admin/mod.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiOkResponse({ description: 'Annotation retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Annotation not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.findOne(id, user);
  }

  // Approve annotation
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve an annotation',
    description: 'Approves a pending annotation. Admin/moderator only.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiOkResponse({ description: 'Annotation approved successfully' })
  @ApiBadRequestResponse({
    description: 'Only pending annotations can be approved',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  @ApiNotFoundResponse({ description: 'Annotation not found' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.approve(id, user);
  }

  // Reject annotation
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject an annotation',
    description:
      'Rejects a pending annotation with a reason. Admin/moderator only.',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiBody({ type: RejectAnnotationDto })
  @ApiOkResponse({ description: 'Annotation rejected successfully' })
  @ApiBadRequestResponse({
    description: 'Only pending annotations can be rejected',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Not authorized' })
  @ApiNotFoundResponse({ description: 'Annotation not found' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RejectAnnotationDto,
    @CurrentUser() user: User,
  ) {
    return await this.annotationsService.reject(id, body.rejectionReason, user);
  }
}
