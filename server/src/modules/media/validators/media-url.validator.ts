import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'mediaUrl', async: false })
export class MediaUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string, args: ValidationArguments) {
    const mediaType = (args.object as any).type;

    if (!url || typeof url !== 'string') return false;

    try {
      const parsedUrl = new URL(url);
      
      switch (mediaType) {
        case 'video':
          // YouTube validation
          if (!(
            parsedUrl.hostname === 'www.youtube.com' ||
            parsedUrl.hostname === 'youtube.com' ||
            parsedUrl.hostname === 'youtu.be'
          )) {
            return false;
          }

          // Validate YouTube URL format
          if (parsedUrl.hostname === 'youtu.be') {
            // Short URL format
            return parsedUrl.pathname.length > 1; // Must have video ID
          } else {
            // Regular youtube.com format
            const videoId = parsedUrl.searchParams.get('v');
            if (!videoId) {
              // Check for embed format
              if (parsedUrl.pathname.startsWith('/embed/')) {
                return parsedUrl.pathname.split('/')[2]?.length > 0;
              }
              return false;
            }
            return true;
          }

        case 'image':
          // First check hostname
          if (!(
            parsedUrl.hostname.endsWith('deviantart.com') ||
            parsedUrl.hostname === 'www.pixiv.net' ||
            parsedUrl.hostname === 'pixiv.net' ||
            parsedUrl.hostname === 'twitter.com' ||
            parsedUrl.hostname === 'x.com' ||
            parsedUrl.hostname === 'www.instagram.com' ||
            parsedUrl.hostname === 'instagram.com'
          )) {
            return false;
          }

          // Validate specific platform formats
          if (parsedUrl.hostname.endsWith('deviantart.com')) {
            return parsedUrl.pathname.length > 1; // Must have some content
          }
          if (parsedUrl.hostname.includes('pixiv')) {
            return parsedUrl.pathname.includes('/artworks/'); // Must be an artwork URL
          }
          if (parsedUrl.hostname === 'twitter.com' || parsedUrl.hostname === 'x.com') {
            return parsedUrl.pathname.split('/').length >= 3; // Must have username and content
          }
          if (parsedUrl.hostname.includes('instagram.com')) {
            return parsedUrl.pathname.includes('/p/') || parsedUrl.pathname.includes('/reel/'); // Must be a post or reel
          }
          return false;

        case 'audio':
          // Allow any valid URL for audio but ensure it has some path
          return parsedUrl.pathname.length > 1;

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const mediaType = (args.object as any).type;
    const url = args.value;
    
    try {
      const parsedUrl = new URL(url);
      
      switch (mediaType) {
        case 'video':
          if (!(parsedUrl.hostname === 'www.youtube.com' || 
               parsedUrl.hostname === 'youtube.com' || 
               parsedUrl.hostname === 'youtu.be')) {
            return 'URL must be from YouTube';
          }
          return 'Invalid YouTube URL format. Must be a valid video URL';
          
        case 'image':
          if (parsedUrl.hostname.endsWith('deviantart.com')) {
            return 'Invalid DeviantArt URL format';
          }
          if (parsedUrl.hostname.includes('pixiv')) {
            return 'Invalid Pixiv URL format. Must be an artwork URL';
          }
          if (parsedUrl.hostname === 'twitter.com' || parsedUrl.hostname === 'x.com') {
            return 'Invalid Twitter URL format';
          }
          if (parsedUrl.hostname.includes('instagram.com')) {
            return 'Invalid Instagram URL format. Must be a post or reel';
          }
          return 'URL must be from DeviantArt, Pixiv, Twitter, or Instagram';
          
        case 'audio':
          return 'Invalid audio URL';
          
        default:
          return 'Invalid media URL';
      }
    } catch {
      return 'Invalid URL format';
    }
  }
}

export function IsMediaUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MediaUrlConstraint,
    });
  };
}
