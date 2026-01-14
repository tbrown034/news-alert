# newsAlert

Real-time OSINT dashboard for geopolitical situational awareness.

## Quick Start
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
```

## Project Structure
```
src/
├── app/
│   ├── api/news/route.ts   # RSS aggregation API
│   ├── layout.tsx          # Root layout + metadata
│   └── page.tsx            # Main dashboard
├── components/
│   ├── NewsCard.tsx        # Individual news item
│   ├── NewsFeed.tsx        # Feed with region tabs
│   ├── WorldMap.tsx        # Interactive map (react-simple-maps)
│   └── PlatformIcon.tsx    # Platform SVG icons (Bluesky, RSS, etc.)
├── lib/
│   ├── sources.ts          # 60+ OSINT sources with metadata
│   ├── rss.ts              # RSS/Atom feed parser
│   ├── keywordDetection.ts # Event severity detection
│   └── activityDetection.ts # Source activity anomalies
└── types/
    └── index.ts            # TypeScript types
```

## Key Features
- **Source tiers**: OFFICIAL, OSINT, REPORTER, GROUND
- **Severity detection**: CRITICAL, HIGH, MODERATE based on keywords
- **Activity anomalies**: Detects when sources post above baseline
- **Region filtering**: Middle East, Ukraine, Taiwan, Venezuela, US

## Docs
- [Architecture](docs/planning.md)
- [Sources Database](docs/sources.md)

## Tech Stack
- Next.js 16 + TypeScript
- Tailwind CSS
- react-simple-maps
- Heroicons

## Deployment
```bash
vercel            # Deploy to Vercel
```

## Working Style
- Work autonomously without checking in at every step
- Use `--chrome` for browser testing
- KISS - Keep It Simple, Stupid
