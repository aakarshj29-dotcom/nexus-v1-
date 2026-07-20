import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard/', '/projects/', '/onboarding/'],
    },
    sitemap: 'https://nexus-v1.vercel.app/sitemap.xml',
  };
}
