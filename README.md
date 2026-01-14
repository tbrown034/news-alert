# newsAlert

Real-time OSINT dashboard for geopolitical situational awareness. Aggregates 60+ sources across Bluesky, RSS feeds, and government accounts to provide at-a-glance monitoring of global hotspots.

![newsAlert Dashboard](docs/screenshot.png)

## Features

- **Real-time feed** from OSINT analysts, journalists, and official sources
- **Smart severity detection** - Keywords analyzed to flag CRITICAL, HIGH, MODERATE events
- **Activity anomalies** - Highlights when sources are posting above their baseline
- **Interactive world map** - Visual overview of regional activity
- **Region filtering** - Middle East, Ukraine, Taiwan, Venezuela, US
- **Source credibility** - Tiered badges (OFFICIAL, OSINT, REPORTER, GROUND)
- **Platform icons** - Bluesky, RSS, Telegram, Twitter/X, Reddit

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **Styling**: Tailwind CSS
- **Map**: react-simple-maps
- **Icons**: Heroicons + custom platform SVGs

## Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/              # Core logic (sources, RSS, detection)
└── types/            # TypeScript definitions
```

## Data Sources

60+ curated sources including:
- **Government**: US State Dept, DHS, USGS, WHO, EU EEAS
- **OSINT**: Bellingcat, ISW, CSIS, OSINTdefender
- **News**: Reuters, BBC, Al Jazeera, Haaretz
- **Analysts**: Shipwreck, NOELREPORTS, Euromaidan Press

See [docs/sources.md](docs/sources.md) for full list.

## Deployment

```bash
# Deploy to Vercel
vercel

# Or build for production
npm run build
npm start
```

## Environment Variables

Create `.env.local`:
```
# Optional: Bluesky auth for higher rate limits
BLUESKY_IDENTIFIER=your-handle.bsky.social
BLUESKY_PASSWORD=your-app-password
```

## License

MIT
