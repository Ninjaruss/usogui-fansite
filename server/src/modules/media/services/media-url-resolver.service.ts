import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ResolvedMediaInfo {
  originalUrl: string;
  directImageUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  author?: string;
  width?: number;
  height?: number;
  platform: string;
  metadata?: any;
}

@Injectable()
export class MediaUrlResolverService {
  private readonly logger = new Logger(MediaUrlResolverService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Resolve a media URL to get direct image URLs and metadata
   */
  async resolveMediaUrl(url: string): Promise<ResolvedMediaInfo> {
    try {
      const lowerUrl = url.toLowerCase();

      if (lowerUrl.includes('deviantart.com')) {
        return this.resolveDeviantArtUrl(url);
      }

      if (lowerUrl.includes('pixiv.net')) {
        return this.resolvePixivUrl(url);
      }

      if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        return this.resolveTwitterUrl(url);
      }

      if (lowerUrl.includes('instagram.com')) {
        return this.resolveInstagramUrl(url);
      }

      // For direct images or unknown platforms, return as-is
      return {
        originalUrl: url,
        directImageUrl: url,
        platform: 'direct',
      };
    } catch (error) {
      this.logger.error(`Failed to resolve media URL: ${url}`, error);
      return {
        originalUrl: url,
        platform: 'unknown',
      };
    }
  }

  /**
   * Resolve DeviantArt URLs using oEmbed API
   */
  private async resolveDeviantArtUrl(url: string): Promise<ResolvedMediaInfo> {
    try {
      const oembedUrl = `https://backend.deviantart.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await firstValueFrom(
        this.httpService.get(oembedUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Usogui-Fansite/1.0',
          },
        }),
      );

      const data = response.data;

      return {
        originalUrl: url,
        directImageUrl: data.url,
        thumbnailUrl: data.thumbnail_url,
        title: data.title,
        author: data.author_name,
        width: data.width,
        height: data.height,
        platform: 'deviantart',
        metadata: {
          authorUrl: data.author_url,
          publishDate: data.pubdate,
          tags: data.tags,
          views: data.community?.statistics?._attributes?.views,
          favorites: data.community?.statistics?._attributes?.favorites,
          thumbnails: {
            small: data.thumbnail_url_150,
            medium: data.thumbnail_url,
            large: data.thumbnail_url_200h,
          },
        },
      };
    } catch (error) {
      this.logger.warn(
        `Failed to resolve DeviantArt URL: ${url}`,
        error.message,
      );
      return {
        originalUrl: url,
        platform: 'deviantart',
      };
    }
  }

  /**
   * Resolve Pixiv URLs (placeholder - would need Pixiv API access)
   */
  private async resolvePixivUrl(url: string): Promise<ResolvedMediaInfo> {
    // Pixiv requires authentication for their API
    // For now, return the original URL
    return {
      originalUrl: url,
      platform: 'pixiv',
    };
  }

  /**
   * Resolve Twitter URLs (placeholder - would need Twitter API access)
   */
  private async resolveTwitterUrl(url: string): Promise<ResolvedMediaInfo> {
    // Twitter API v2 requires authentication and has rate limits
    // For now, return the original URL
    return {
      originalUrl: url,
      platform: 'twitter',
    };
  }

  /**
   * Resolve Instagram URLs (placeholder - Instagram doesn't have public oEmbed for all content)
   */
  private async resolveInstagramUrl(url: string): Promise<ResolvedMediaInfo> {
    // Instagram oEmbed is limited and requires Facebook app approval
    // For now, return the original URL
    return {
      originalUrl: url,
      platform: 'instagram',
    };
  }

  /**
   * Cache resolved URLs to avoid repeated API calls
   */
  private cache = new Map<
    string,
    { data: ResolvedMediaInfo; timestamp: number }
  >();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  async resolveMediaUrlCached(url: string): Promise<ResolvedMediaInfo> {
    const cached = this.cache.get(url);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const resolved = await this.resolveMediaUrl(url);

    // Only cache successful resolutions
    if (resolved.directImageUrl || resolved.thumbnailUrl) {
      this.cache.set(url, { data: resolved, timestamp: Date.now() });
    }

    return resolved;
  }
}
