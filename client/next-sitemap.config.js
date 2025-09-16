/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://l-file.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin/*',
    '/auth/*',
    '/submit-*',
    '/profile',
    '/test-*',
    '/debug-*'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/about'),
    await config.transform(config, '/disclaimer'),
    await config.transform(config, '/characters'),
    await config.transform(config, '/arcs'),
    await config.transform(config, '/gambles'),
    await config.transform(config, '/guides'),
    await config.transform(config, '/volumes'),
    await config.transform(config, '/chapters'),
    await config.transform(config, '/events'),
    await config.transform(config, '/organizations'),
    await config.transform(config, '/quotes'),
    await config.transform(config, '/users'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/auth',
          '/submit-guide',
          '/submit-media',
          '/profile',
          '/test-*',
          '/debug-*'
        ]
      }
    ],
    additionalSitemaps: [
      'https://l-file.com/sitemap.xml',
    ],
  },
  priority: null,
  changefreq: null,
  transform: async (config, path) => {
    // Custom priority and changefreq for different page types
    let priority = 0.7
    let changefreq = 'weekly'

    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.includes('/characters') || path.includes('/arcs') || path.includes('/gambles')) {
      priority = 0.8
      changefreq = 'weekly'
    } else if (path.includes('/guides')) {
      priority = 0.9
      changefreq = 'daily'
    } else if (path === '/about' || path === '/disclaimer') {
      priority = 0.3
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}