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
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ArcsService } from './arcs.service';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateArcDto } from './dto/create-arc.dto';
import { UpdateArcDto } from './dto/update-arc.dto';
import { UpdateArcImageDto } from './dto/update-arc-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { BackblazeB2Service } from '../../services/backblaze-b2.service';

@ApiTags('arcs')
@Controller('arcs')
export class ArcsController {
  constructor(
    private readonly service: ArcsService,
    private readonly b2Service: BackblazeB2Service,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all arcs',
    description:
      'Retrieve a paginated list of arcs with optional filtering by name and description',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by arc name',
  })
  // series removed
  @ApiQuery({
    name: 'description',
    required: false,
    description: 'Filter by description content',
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
  @ApiResponse({
    status: 200,
    description: 'Arcs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Tower of Karma Arc' },
              description: {
                type: 'string',
                example: 'A deadly tournament held in a mysterious tower',
              },
              startChapter: { type: 'number', example: 150 },
              endChapter: { type: 'number', example: 210 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 15 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Query('name') name?: string,
    @Query('description') description?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort?: string,
    @Query('order') order: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{ data: Arc[]; total: number; page: number; totalPages: number }> {
    return this.service.findAll({
      name,
      description,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get arc by ID',
    description: 'Retrieve a specific arc by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Arc found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Tower of Karma Arc' },
        description: {
          type: 'string',
          example: 'A deadly tournament held in a mysterious tower',
        },
        startChapter: { type: 'number', example: 150 },
        endChapter: { type: 'number', example: 210 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  async getOne(@Param('id') id: number): Promise<Arc> {
    const arc = await this.service.findOne(id);
    if (!arc) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return arc;
  }

  @Get(':id/chapters')
  @ApiOperation({
    summary: 'Get chapters in arc',
    description:
      "Retrieve all chapters within the arc's chapter range (startChapter to endChapter)",
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Chapters in arc retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 150 },
          number: { type: 'number', example: 150 },
          title: { type: 'string', example: 'The Tower Begins' },
          summary: {
            type: 'string',
            example: 'Introduction to the Tower of Karma tournament',
          },
          // series removed from chapter response
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  async getChapters(@Param('id') id: number): Promise<Chapter[]> {
    return this.service.getChaptersInArc(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new arc',
    description: 'Create a new arc (requires moderator or admin role)',
  })
  @ApiBody({ type: CreateArcDto })
  @ApiResponse({
    status: 201,
    description: 'Arc created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        name: { type: 'string', example: 'Air Poker Arc' },
        description: {
          type: 'string',
          example: 'High-stakes poker games with deadly consequences',
        },
        startChapter: { type: 'number', example: 75 },
        endChapter: { type: 'number', example: 85 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createArcDto: CreateArcDto) {
    return this.service.create(createArcDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update arc',
    description: 'Update an existing arc (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiBody({
    description: 'Updated arc data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tower of Karma Arc' },
        description: {
          type: 'string',
          example: 'Updated description of the tower tournament',
        },
        startChapter: { type: 'number', example: 150 },
        endChapter: { type: 'number', example: 215 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Arc updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: number, @Body() data: UpdateArcDto) {
    const result = await this.service.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete arc',
    description: 'Delete an arc (requires moderator or admin role)',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Arc deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires moderator or admin role',
  })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async remove(@Param('id') id: number) {
    const result = await this.service.remove(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }
    return { message: 'Deleted successfully' };
  }

  @Put(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update arc image',
    description: 'Update arc image (moderators/admins only, automatically approved)',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiBody({
    description: 'Arc image data',
    type: UpdateArcImageDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Arc image updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - moderator/admin role required' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  updateImage(@Param('id') id: number, @Body() imageData: UpdateArcImageDto) {
    return this.service.updateImage(id, imageData);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload arc image',
    description: 'Upload image file for arc (moderators/admins only, automatically approved)',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arc image file and optional display name',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, GIF)',
        },
        imageDisplayName: {
          type: 'string',
          description: 'Optional display name for the image',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Arc image uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or missing file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - moderator/admin role required' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async uploadArcImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: { imageDisplayName?: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (JPEG, PNG, WebP, GIF) are allowed');
    }

    // Get existing arc to check for old image
    const existingArc = await this.service.findOne(id);
    if (!existingArc) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }

    // Generate unique filename with arc prefix
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `arc_${id}_${timestamp}.${fileExtension}`;

    // Upload new file to B2
    const uploadResult = await this.b2Service.uploadFile(
      file.buffer,
      uniqueFileName,
      file.mimetype,
      'arcs'
    );

    // Delete old image if it exists
    if (existingArc.imageFileName) {
      try {
        // Extract filename from URL if it's a full URL, otherwise use as-is
        let oldFileName = existingArc.imageFileName;
        if (oldFileName.includes('/')) {
          const urlParts = oldFileName.split('/');
          oldFileName = urlParts[urlParts.length - 1];
          // If it includes the folder path, keep it
          if (urlParts.length > 1 && urlParts[urlParts.length - 2] === 'arcs') {
            oldFileName = `arcs/${oldFileName}`;
          }
        } else {
          // If it's just a filename, add the arcs folder path
          oldFileName = `arcs/${oldFileName}`;
        }
        await this.b2Service.deleteFile(oldFileName);
      } catch (error) {
        // Log the error but don't fail the upload
        console.error('Failed to delete old arc image:', error);
      }
    }

    // Update arc with the full image URL
    const imageData = {
      imageFileName: uploadResult.url, // Store the full URL
      imageDisplayName: data.imageDisplayName,
    };

    return this.service.updateImage(id, imageData);
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove arc image',
    description: 'Remove image from arc (moderators/admins only)',
  })
  @ApiParam({ name: 'id', description: 'Arc ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Arc image removed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - moderator/admin role required' })
  @ApiResponse({ status: 404, description: 'Arc not found' })
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async removeImage(@Param('id') id: number) {
    // Get existing arc to check for image
    const existingArc = await this.service.findOne(id);
    if (!existingArc) {
      throw new NotFoundException(`Arc with id ${id} not found`);
    }

    // Delete the image file from B2 if it exists
    if (existingArc.imageFileName) {
      try {
        // Extract filename from URL if it's a full URL, otherwise use as-is
        let fileName = existingArc.imageFileName;
        if (fileName.includes('/')) {
          const urlParts = fileName.split('/');
          fileName = urlParts[urlParts.length - 1];
          // If it includes the folder path, keep it
          if (urlParts.length > 1 && urlParts[urlParts.length - 2] === 'arcs') {
            fileName = `arcs/${fileName}`;
          }
        } else {
          // If it's just a filename, add the arcs folder path
          fileName = `arcs/${fileName}`;
        }
        await this.b2Service.deleteFile(fileName);
      } catch (error) {
        // Log the error but don't fail the removal
        console.error('Failed to delete arc image file:', error);
      }
    }

    return this.service.removeImage(id);
  }
}
