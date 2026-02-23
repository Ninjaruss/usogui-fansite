import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profile/', '/submit-guide/', '/submit-media/', '/submit-event/', '/submit-annotation/', '/auth/'],
    },
    sitemap: 'https://l-file.com/sitemap.xml',
  }
}
