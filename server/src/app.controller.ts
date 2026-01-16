import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  PageViewsService,
  TrendingPage,
} from './modules/page-views/page-views.service';
import { PageType } from './entities/page-view.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Guide, GuideStatus } from './entities/guide.entity';
import { Character } from './entities/character.entity';
import { Event } from './entities/event.entity';
import { Gamble } from './entities/gamble.entity';
import { Arc } from './entities/arc.entity';
import { Media } from './entities/media.entity';
import { User } from './entities/user.entity';
import { UsersService } from './modules/users/users.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly pageViewsService: PageViewsService,
    private readonly usersService: UsersService,
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Gamble)
    private readonly gambleRepository: Repository<Gamble>,
    @InjectRepository(Arc)
    private readonly arcRepository: Repository<Arc>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint for container orchestration',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T12:00:00.000Z' },
      },
    },
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get landing page data with trending content' })
  @ApiResponse({
    status: 200,
    description: 'Landing page data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        trending: {
          type: 'object',
          properties: {
            guides: { type: 'array' },
            characters: { type: 'array' },
            events: { type: 'array' },
            gambles: { type: 'array' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalCharacters: { type: 'number' },
            totalArcs: { type: 'number' },
            totalEvents: { type: 'number' },
            totalGuides: { type: 'number' },
            totalMedia: { type: 'number' },
            totalUsers: { type: 'number' },
          },
        },
      },
    },
  })
  async getLandingPageData(
    @Query('limit') limit: number = 5,
    @Query('daysBack') daysBack: number = 7,
  ) {
    // Get trending pages by type
    const trendingByType = await this.pageViewsService.getTrendingPagesByType(
      limit,
      daysBack,
    );

    // Get actual entity data for trending items
    const trendingGuides = await this.getGuideDetails(
      trendingByType[PageType.GUIDE] || [],
    );
    const trendingCharacters = await this.getCharacterDetails(
      trendingByType[PageType.CHARACTER] || [],
    );
    const trendingEvents = await this.getEventDetails(
      trendingByType[PageType.EVENT] || [],
    );
    const trendingGambles = await this.getGambleDetails(
      trendingByType[PageType.GAMBLE] || [],
    );

    // Get basic stats
    const [
      totalCharacters,
      totalArcs,
      totalEvents,
      totalGuides,
      totalMedia,
      totalUsers,
    ] = await Promise.all([
      this.characterRepository.count(),
      this.arcRepository.count(),
      this.eventRepository.count(),
      this.guideRepository.count({
        where: { status: GuideStatus.APPROVED },
      }),
      this.mediaRepository.count(),
      this.userRepository.count(),
    ]);

    return {
      trending: {
        guides: trendingGuides,
        characters: trendingCharacters,
        events: trendingEvents,
        gambles: trendingGambles,
      },
      stats: {
        totalCharacters,
        totalArcs,
        totalEvents,
        totalGuides,
        totalMedia,
        totalUsers,
      },
    };
  }

  @Get('favorites')
  @ApiOperation({
    summary: 'Get top 3 favorite quotes, gambles, and character media',
    description:
      'Retrieve the most popular quotes, gambles, and character media based on user favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Top favorites data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        favoriteQuotes: {
          type: 'array',
          description: 'Top 3 most favorite quotes',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'object' },
              userCount: { type: 'number' },
            },
          },
        },
        favoriteGambles: {
          type: 'array',
          description: 'Top 3 most favorite gambles',
          items: {
            type: 'object',
            properties: {
              gamble: { type: 'object' },
              userCount: { type: 'number' },
            },
          },
        },
        favoriteCharacterMedia: {
          type: 'array',
          description: 'Top 3 most used character media for profiles',
          items: {
            type: 'object',
            properties: {
              media: { type: 'object' },
              userCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getFavoritesData() {
    // Get top 3 favorite quotes
    const quoteStats = await this.usersService.getQuotePopularityStats();
    const favoriteQuotes = quoteStats.slice(0, 3);

    // Get top 3 favorite gambles
    const gambleStats = await this.usersService.getGamblePopularityStats();
    const favoriteGambles = gambleStats.slice(0, 3);

    // Get top 3 character media stats
    const characterMediaStats =
      await this.usersService.getCharacterMediaPopularityStats();
    const favoriteCharacterMedia = characterMediaStats.slice(0, 3);

    return {
      favoriteQuotes,
      favoriteGambles,
      favoriteCharacterMedia,
    };
  }

  // Helper methods for getting detailed entity data
  private async getGuideDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const guideIds = trendingPages.map((p) => p.pageId);
    const guides = await this.guideRepository.find({
      where: { id: In(guideIds), status: GuideStatus.APPROVED },
      relations: ['author'],
    });

    return guides.map((guide) => {
      const trendingPage = trendingPages.find((p) => p.pageId === guide.id);
      return {
        id: guide.id,
        title: guide.title,
        description: guide.description,
        viewCount: trendingPage?.viewCount || 0,
        recentViewCount: trendingPage?.recentViewCount || 0,
        author: { id: guide.author.id, username: guide.author.username },
        createdAt: guide.createdAt.toISOString(),
      };
    });
  }

  private async getCharacterDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const characterIds = trendingPages.map((p) => p.pageId);
    const characters = await this.characterRepository.find({
      where: { id: In(characterIds) },
    });

    return characters.map((character) => {
      const trendingPage = trendingPages.find((p) => p.pageId === character.id);
      return {
        id: character.id,
        name: character.name,
        description: character.description,
        viewCount: trendingPage?.viewCount || 0,
        recentViewCount: trendingPage?.recentViewCount || 0,
      };
    });
  }

  private async getEventDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const eventIds = trendingPages.map((p) => p.pageId);
    const events = await this.eventRepository.find({
      where: { id: In(eventIds) },
    });

    return events.map((event) => {
      const trendingPage = trendingPages.find((p) => p.pageId === event.id);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        viewCount: trendingPage?.viewCount || 0,
        recentViewCount: trendingPage?.recentViewCount || 0,
      };
    });
  }

  private async getGambleDetails(trendingPages: TrendingPage[]) {
    if (trendingPages.length === 0) return [];

    const gambleIds = trendingPages.map((p) => p.pageId);
    const gambles = await this.gambleRepository.find({
      where: { id: In(gambleIds) },
    });

    return gambles.map((gamble) => {
      const trendingPage = trendingPages.find((p) => p.pageId === gamble.id);
      return {
        id: gamble.id,
        name: gamble.name,
        rules: gamble.rules,
        viewCount: trendingPage?.viewCount || 0,
        recentViewCount: trendingPage?.recentViewCount || 0,
      };
    });
  }
}
