import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://news-alert.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ];
}
