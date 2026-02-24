// Utility functions for handling different types of media URLs

export interface MediaInfo {
  isDirectImage: boolean
  isEmbeddable: boolean
  platform?: 'deviantart' | 'pixiv' | 'twitter' | 'instagram' | 'youtube' | 'direct'
  embedUrl?: string
  thumbnailUrl?: string
  directImageUrl?: string
  title?: string
  author?: string
  width?: number
  height?: number
}

export interface DeviantArtOEmbedResponse {
  version: string
  type: string
  title: string
  url: string
  author_name: string
  author_url: string
  provider_name: string
  provider_url: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  width: number
  height: number
}

/**
 * Analyzes a media URL to determine how it should be displayed
 */
export function analyzeMediaUrl(url: string): MediaInfo {
  if (!url) {
    return { isDirectImage: false, isEmbeddable: false }
  }

  const lowerUrl = url.toLowerCase()

  // Check for DeviantArt CDN URLs with JWT tokens (which expire and cause issues)
  if (lowerUrl.includes('images-wixmp-') && lowerUrl.includes('token=')) {
    return {
      isDirectImage: false,
      isEmbeddable: false,
      platform: 'deviantart'
    }
  }

  // Check for direct image URLs
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
    return {
      isDirectImage: true,
      isEmbeddable: false,
      platform: 'direct'
    }
  }

  // DeviantArt handling
  if (lowerUrl.includes('deviantart.com')) {
    const isArtPage = lowerUrl.includes('/art/')
    // Check if it's a direct DeviantArt image URL
    const isDirectImage = Boolean(
      lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) &&
      (lowerUrl.includes('wixmp') || lowerUrl.includes('images-wixmp'))
    )

    return {
      isDirectImage: isDirectImage,
      isEmbeddable: isArtPage && !isDirectImage,
      platform: 'deviantart',
      embedUrl: (isArtPage && !isDirectImage) ? `${url}/embed` : undefined
    }
  }

  // YouTube handling
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    let videoId = ''

    if (lowerUrl.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
    } else if (lowerUrl.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || ''
    } else if (lowerUrl.includes('youtube.com/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0] || ''
    }

    return {
      isDirectImage: false,
      isEmbeddable: true,
      platform: 'youtube',
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined,
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined
    }
  }

  // Twitter/X handling
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return {
      isDirectImage: false,
      isEmbeddable: true,
      platform: 'twitter'
    }
  }

  // Instagram handling
  if (lowerUrl.includes('instagram.com')) {
    return {
      isDirectImage: false,
      isEmbeddable: true,
      platform: 'instagram'
    }
  }

  // Pixiv handling
  if (lowerUrl.includes('pixiv.net')) {
    return {
      isDirectImage: false,
      isEmbeddable: false,
      platform: 'pixiv'
    }
  }

  // Default: assume it might be a direct image
  return {
    isDirectImage: true,
    isEmbeddable: false,
    platform: 'direct'
  }
}

/**
 * Resolve DeviantArt URLs to get direct image URLs
 */
export async function resolveDeviantArtUrl(url: string): Promise<MediaInfo> {
  try {
    const oembedUrl = `https://backend.deviantart.com/oembed?url=${encodeURIComponent(url)}`

    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'L-file/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`DeviantArt oEmbed failed: ${response.status}`)
    }

    const data: DeviantArtOEmbedResponse = await response.json()

    return {
      isDirectImage: true,
      isEmbeddable: false,
      platform: 'deviantart',
      directImageUrl: data.thumbnail_url, // Use thumbnail_url as the direct image
      thumbnailUrl: data.thumbnail_url,
      title: data.title,
      author: data.author_name,
      width: data.thumbnail_width,
      height: data.thumbnail_height
    }
  } catch (error) {
    console.warn(`Failed to resolve DeviantArt URL: ${url}`, error)
    return {
      isDirectImage: false,
      isEmbeddable: false,
      platform: 'deviantart'
    }
  }
}

/**
 * Enhanced media URL analysis with async resolution for supported platforms
 */
export async function analyzeMediaUrlAsync(url: string): Promise<MediaInfo> {
  const baseInfo = analyzeMediaUrl(url)

  // If it's a DeviantArt URL, try to resolve it
  if (baseInfo.platform === 'deviantart' && url.includes('/art/')) {
    return await resolveDeviantArtUrl(url)
  }

  return baseInfo
}

/**
 * Gets a placeholder thumbnail for non-direct image URLs
 */
export function getPlaceholderInfo(platform: string): { icon: string; label: string; color: string } {
  switch (platform) {
    case 'deviantart':
      return { icon: '🎨', label: 'DeviantArt', color: '#05cc47' }
    case 'pixiv':
      return { icon: '🖼️', label: 'Pixiv', color: '#0096fa' }
    case 'twitter':
      return { icon: '🐦', label: 'Twitter', color: '#1da1f2' }
    case 'instagram':
      return { icon: '📷', label: 'Instagram', color: '#e4405f' }
    case 'youtube':
      return { icon: '▶️', label: 'YouTube', color: '#ff0000' }
    default:
      return { icon: '🔗', label: 'External', color: '#6b7280' }
  }
}
