import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlNormalizerService {
  normalizeYoutubeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);

      // Handle youtu.be links
      if (parsedUrl.hostname === 'youtu.be') {
        const videoId = parsedUrl.pathname.slice(1);
        return `https://www.youtube.com/watch?v=${videoId}`;
      }

      // Handle regular youtube.com links
      if (
        parsedUrl.hostname === 'youtube.com' ||
        parsedUrl.hostname === 'www.youtube.com'
      ) {
        const videoId = parsedUrl.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/watch?v=${videoId}`;
        }

        // Handle youtube.com/embed/ links
        if (parsedUrl.pathname.startsWith('/embed/')) {
          const videoId = parsedUrl.pathname.split('/')[2];
          return `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      return url;
    } catch {
      return url;
    }
  }

  normalizeTwitterUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === 'x.com') {
        return url.replace('x.com', 'twitter.com');
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizePixivUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname === 'www.pixiv.net' ||
        parsedUrl.hostname === 'pixiv.net'
      ) {
        // Ensure artwork URLs are in the standard format
        if (parsedUrl.pathname.includes('/artworks/')) {
          const artworkId = parsedUrl.pathname.split('/artworks/')[1];
          return `https://www.pixiv.net/artworks/${artworkId}`;
        }
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizeDeviantArtUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.endsWith('deviantart.com')) {
        // DeviantArt URLs are already pretty standardized
        return url;
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizeInstagramUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname === 'instagram.com' ||
        parsedUrl.hostname === 'www.instagram.com'
      ) {
        // Ensure we're using www subdomain
        return url.replace('instagram.com', 'www.instagram.com');
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizeTikTokUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname === 'tiktok.com' ||
        parsedUrl.hostname === 'www.tiktok.com' ||
        parsedUrl.hostname === 'vm.tiktok.com'
      ) {
        // For short links (vm.tiktok.com), keep as-is since they redirect
        if (parsedUrl.hostname === 'vm.tiktok.com') {
          return url;
        }
        // Normalize regular TikTok URLs to use www subdomain
        return url.replace(/^https?:\/\/(www\.)?tiktok\.com/, 'https://www.tiktok.com');
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizeImgurUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname === 'imgur.com' ||
        parsedUrl.hostname === 'www.imgur.com' ||
        parsedUrl.hostname === 'i.imgur.com'
      ) {
        // For direct image links (i.imgur.com), keep as-is
        if (parsedUrl.hostname === 'i.imgur.com') {
          return url;
        }
        // Normalize gallery/album URLs to use www subdomain
        return url.replace(/^https?:\/\/(www\.)?imgur\.com/, 'https://www.imgur.com');
      }
      return url;
    } catch {
      return url;
    }
  }

  normalizeSoundCloudUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname === 'soundcloud.com' ||
        parsedUrl.hostname === 'www.soundcloud.com'
      ) {
        // Ensure we're using www subdomain
        return url.replace(/^https?:\/\/(www\.)?soundcloud\.com/, 'https://www.soundcloud.com');
      }
      return url;
    } catch {
      return url;
    }
  }

  normalize(url: string, type: string): string {
    switch (type) {
      case 'video':
        // Check for TikTok first, then YouTube
        if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) {
          return this.normalizeTikTokUrl(url);
        }
        return this.normalizeYoutubeUrl(url);
      case 'audio':
        return this.normalizeSoundCloudUrl(url);
      case 'image':
        // Apply all image normalizers and return the first one that changes the URL
        const normalizers = [
          this.normalizeTwitterUrl,
          this.normalizePixivUrl,
          this.normalizeDeviantArtUrl,
          this.normalizeInstagramUrl,
          this.normalizeImgurUrl,
        ];

        for (const normalizer of normalizers) {
          const normalized = normalizer.call(this, url);
          if (normalized !== url) return normalized;
        }
        return url;
      default:
        return url;
    }
  }
}
