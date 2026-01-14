import { Source, WatchpointId } from '@/types';
import { provenanceTemplates, createProvenance } from './provenance';

// =============================================================================
// SOURCE HIERARCHY WITH PROVENANCE
// =============================================================================
// Each source now includes:
// - provenance: How this source typically obtains information
// - baselinePostsPerDay: Expected posting frequency (for anomaly detection)

// -----------------------------------------------------------------------------
// OSINT ANALYSTS - Original analysis of imagery/data
// -----------------------------------------------------------------------------
export const osintAnalysts: (Source & { feedUrl: string })[] = [
  {
    id: 'bellingcat',
    name: 'Bellingcat',
    handle: '@bellingcat.com',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/bellingcat.com/rss',
    url: 'https://bsky.app/profile/bellingcat.com',
    provenance: provenanceTemplates.osintAnalysis,
    baselinePostsPerDay: 3,
  },
  {
    id: 'eliot-higgins',
    name: 'Eliot Higgins',
    handle: '@eliothiggins.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/eliothiggins.bsky.social/rss',
    url: 'https://bsky.app/profile/eliothiggins.bsky.social',
    provenance: provenanceTemplates.osintAnalysis,
    baselinePostsPerDay: 5,
  },
  {
    id: 'isw',
    name: 'ISW',
    handle: '@thestudyofwar.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 95,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/thestudyofwar.bsky.social/rss',
    url: 'https://bsky.app/profile/thestudyofwar.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 2,
  },
  {
    id: 'osinttechnical',
    name: 'OSINTtechnical',
    handle: '@osinttechnical.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/osinttechnical.bsky.social/rss',
    url: 'https://bsky.app/profile/osinttechnical.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Equipment identification and military analysis'),
    baselinePostsPerDay: 15,
  },
  {
    id: 'aurora-intel',
    name: 'Aurora Intel',
    handle: '@auroraintel.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/auroraintel.bsky.social/rss',
    url: 'https://bsky.app/profile/auroraintel.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Middle East OSINT analysis and threads'),
    baselinePostsPerDay: 8,
  },
  {
    id: 'dfrlab',
    name: 'DFRLab',
    handle: '@dfrlab.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 85,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/dfrlab.bsky.social/rss',
    url: 'https://bsky.app/profile/dfrlab.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Disinformation tracking and geopolitical analysis'),
    baselinePostsPerDay: 3,
  },
  {
    id: 'osint-intuit',
    name: 'OSINT Intuit',
    handle: '@urikikaski.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/urikikaski.bsky.social/rss',
    url: 'https://bsky.app/profile/urikikaski.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Ukraine conflict OSINT analysis'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'wartranslated',
    name: 'WarTranslated',
    handle: '@wartranslated.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/wartranslated.bsky.social/rss',
    url: 'https://bsky.app/profile/wartranslated.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Translates and analyzes Russian sources'),
    baselinePostsPerDay: 10,
  },
  {
    id: 'oliver-alexander',
    name: 'Oliver Alexander',
    handle: '@oalexanderdk.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 85,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/oalexanderdk.bsky.social/rss',
    url: 'https://bsky.app/profile/oalexanderdk.bsky.social',
    provenance: createProvenance('analysis', undefined, 'High quality OSINT curation and analysis'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'rob-lee',
    name: 'Rob Lee',
    handle: '@ralee85.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 92,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/ralee85.bsky.social/rss',
    url: 'https://bsky.app/profile/ralee85.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 8,
  },
  {
    id: 'michael-kofman',
    name: 'Michael Kofman',
    handle: '@michaelkofman.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 92,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/michaelkofman.bsky.social/rss',
    url: 'https://bsky.app/profile/michaelkofman.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  {
    id: 'intel-crab',
    name: 'The Intel Crab',
    handle: '@intelcrab.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/intelcrab.bsky.social/rss',
    url: 'https://bsky.app/profile/intelcrab.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Conflict and geopolitical analysis'),
    baselinePostsPerDay: 10,
  },
  {
    id: 'elint-news',
    name: 'ELINT News',
    handle: '@elintnews.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/elintnews.bsky.social/rss',
    url: 'https://bsky.app/profile/elintnews.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Geopolitical and military intelligence analysis'),
    baselinePostsPerDay: 12,
  },
  {
    id: 'chriso-wiki',
    name: 'ChrisO',
    handle: '@chriso-wiki.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 85,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/chriso-wiki.bsky.social/rss',
    url: 'https://bsky.app/profile/chriso-wiki.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Ukraine conflict analysis and historical context'),
    baselinePostsPerDay: 15,
  },
  // --- IRAN / MIDDLE EAST ANALYSTS ---
  {
    id: 'thomas-juneau',
    name: 'Thomas Juneau',
    handle: '@thomasjuneau.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 90,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/thomasjuneau.bsky.social/rss',
    url: 'https://bsky.app/profile/thomasjuneau.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 5,
  },
  {
    id: 'shipwreck75',
    name: 'Shipwreck',
    handle: '@shipwreck75.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 85,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/shipwreck75.bsky.social/rss',
    url: 'https://bsky.app/profile/shipwreck75.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Intel analyst with 30+ years experience'),
    baselinePostsPerDay: 8,
  },
  {
    id: 'critical-threats',
    name: 'Critical Threats',
    handle: '@criticalthreats.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 92,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/criticalthreats.bsky.social/rss',
    url: 'https://bsky.app/profile/criticalthreats.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  {
    id: 'intel-night-owl',
    name: 'Intel Night OWL',
    handle: '@intelnightowl.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 78,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/intelnightowl.bsky.social/rss',
    url: 'https://bsky.app/profile/intelnightowl.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Middle East news aggregation and analysis'),
    baselinePostsPerDay: 15,
  },
  {
    id: 'niv-calderon',
    name: 'Niv Calderon',
    handle: '@nivcalderon.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/nivcalderon.bsky.social/rss',
    url: 'https://bsky.app/profile/nivcalderon.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Middle East OSINT, Israel/Lebanon/Syria/Iran/Yemen focus'),
    baselinePostsPerDay: 30,
  },
  {
    id: 'iran-international',
    name: 'Iran International',
    handle: '@iraninternational.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 82,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/iraninternational.bsky.social/rss',
    url: 'https://bsky.app/profile/iraninternational.bsky.social',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 50,
  },
  // --- THINK TANKS ---
  {
    id: 'timep',
    name: 'TIMEP',
    handle: '@timep.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 88,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/timep.bsky.social/rss',
    url: 'https://bsky.app/profile/timep.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  {
    id: 'merip',
    name: 'MERIP',
    handle: '@merip.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 88,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/merip.bsky.social/rss',
    url: 'https://bsky.app/profile/merip.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  {
    id: 'csis',
    name: 'CSIS',
    handle: '@csis.org',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 92,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/csis.org/rss',
    url: 'https://bsky.app/profile/csis.org',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 5,
  },
  {
    id: 'osw-centre',
    name: 'OSW Centre for Eastern Studies',
    handle: '@osweng.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 88,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/osweng.bsky.social/rss',
    url: 'https://bsky.app/profile/osweng.bsky.social',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  // --- ADDITIONAL UKRAINE/RUSSIA ANALYSTS ---
  {
    id: 'anders-puck-nielsen',
    name: 'Anders Puck Nielsen',
    handle: '@anderspucknielsen.dk',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 88,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/anderspucknielsen.dk/rss',
    url: 'https://bsky.app/profile/anderspucknielsen.dk',
    provenance: provenanceTemplates.research,
    baselinePostsPerDay: 3,
  },
  {
    id: 'ryan-mcbeth',
    name: 'Ryan McBeth',
    handle: '@ryanmcbeth.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 82,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/ryanmcbeth.bsky.social/rss',
    url: 'https://bsky.app/profile/ryanmcbeth.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Military analysis and OSINT'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'black-bird-group',
    name: 'Black Bird Group',
    handle: '@blackbirdgroup.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 82,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/blackbirdgroup.bsky.social/rss',
    url: 'https://bsky.app/profile/blackbirdgroup.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Finnish OSINT group, conflict analysis'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'ukraine-map',
    name: 'Ukraine Battle Map',
    handle: '@ukrainemap.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 78,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/ukrainemap.bsky.social/rss',
    url: 'https://bsky.app/profile/ukrainemap.bsky.social',
    provenance: createProvenance('analysis', undefined, 'Conflict mapping and territorial changes'),
    baselinePostsPerDay: 8,
  },
];

// -----------------------------------------------------------------------------
// OSINT AGGREGATORS - Compile and amplify reports
// -----------------------------------------------------------------------------
export const osintAggregators: (Source & { feedUrl: string })[] = [
  {
    id: 'noelreports',
    name: 'NOELREPORTS',
    handle: '@noelreports.com',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 75,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/noelreports.com/rss',
    url: 'https://bsky.app/profile/noelreports.com',
    provenance: createProvenance('aggregated', 'mixed', 'Fast aggregation of conflict updates'),
    baselinePostsPerDay: 30,
  },
  {
    id: 'war-monitor',
    name: 'The War Monitor',
    handle: '@warmonitor.net',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 75,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/warmonitor.net/rss',
    url: 'https://bsky.app/profile/warmonitor.net',
    provenance: createProvenance('aggregated', 'ground', 'Aggregates ground-level conflict reports'),
    baselinePostsPerDay: 20,
  },
  {
    id: 'euromaidan-press',
    name: 'Euromaidan Press',
    handle: '@euromaidanpress.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/euromaidanpress.bsky.social/rss',
    url: 'https://bsky.app/profile/euromaidanpress.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Ukraine news aggregation in English'),
    baselinePostsPerDay: 15,
  },
  {
    id: 'meanwhile-ukraine',
    name: 'Meanwhile in Ukraine',
    handle: '@meanwhileua.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 75,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/meanwhileua.bsky.social/rss',
    url: 'https://bsky.app/profile/meanwhileua.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Ukraine news and updates aggregation'),
    baselinePostsPerDay: 12,
  },
  {
    id: 'project-owl',
    name: 'Project Owl',
    handle: '@projectowlosint.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/projectowlosint.bsky.social/rss',
    url: 'https://bsky.app/profile/projectowlosint.bsky.social',
    provenance: createProvenance('aggregated', 'analysis', 'OSINT community hub, foreign policy focus'),
    baselinePostsPerDay: 8,
  },
  {
    id: 'geoinsider',
    name: 'GeoInsider',
    handle: '@geoinsider.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 75,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/geoinsider.bsky.social/rss',
    url: 'https://bsky.app/profile/geoinsider.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Geopolitical and military news aggregation'),
    baselinePostsPerDay: 15,
  },
  {
    id: 'steve-lookner',
    name: 'Steve Lookner',
    handle: '@lookner.bsky.social',
    platform: 'bluesky',
    tier: 'ground',
    confidence: 75,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/lookner.bsky.social/rss',
    url: 'https://bsky.app/profile/lookner.bsky.social',
    provenance: createProvenance('aggregated', 'ground', 'Live breaking news aggregation'),
    baselinePostsPerDay: 40,
  },
  {
    id: 'osintdefender',
    name: 'OSINTdefender',
    handle: '@sentdefender.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 78,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/sentdefender.bsky.social/rss',
    url: 'https://bsky.app/profile/sentdefender.bsky.social',
    provenance: createProvenance('aggregated', 'mixed', 'Fast breaking news aggregation, conflict focus'),
    baselinePostsPerDay: 50,
  },
];

// -----------------------------------------------------------------------------
// FLIGHT/DATA TRACKERS - Real-time data analysis
// -----------------------------------------------------------------------------
export const dataTrackers: (Source & { feedUrl: string })[] = [
  {
    id: 'evergreen-intel',
    name: 'Evergreen Intel',
    handle: '@vcdgf555.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 80,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/vcdgf555.bsky.social/rss',
    url: 'https://bsky.app/profile/vcdgf555.bsky.social',
    provenance: provenanceTemplates.dataTracker,
    baselinePostsPerDay: 10,
  },
  {
    id: 'netblocks',
    name: 'NetBlocks',
    handle: '@netblocks.org',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 90,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/netblocks.org/rss',
    url: 'https://bsky.app/profile/netblocks.org',
    provenance: provenanceTemplates.dataTracker,
    baselinePostsPerDay: 5,
  },
  {
    id: 'geoconfirmed',
    name: 'GeoConfirmed',
    handle: '@geoconfirmed.org',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 88,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/geoconfirmed.org/rss',
    url: 'https://bsky.app/profile/geoconfirmed.org',
    provenance: createProvenance('analysis', undefined, 'Geolocation verification of conflict footage'),
    baselinePostsPerDay: 10,
  },
  {
    id: 'status-6',
    name: 'Status-6',
    handle: '@archer83able.bsky.social',
    platform: 'bluesky',
    tier: 'osint',
    confidence: 82,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/archer83able.bsky.social/rss',
    url: 'https://bsky.app/profile/archer83able.bsky.social',
    provenance: provenanceTemplates.dataTracker,
    baselinePostsPerDay: 8,
  },
];

// -----------------------------------------------------------------------------
// KEY REPORTERS - Journalists with direct access
// -----------------------------------------------------------------------------
export const reporters: (Source & { feedUrl: string })[] = [
  {
    id: 'christopher-miller',
    name: 'Christopher Miller',
    handle: '@christopherjm.ft.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 90,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/christopherjm.ft.com/rss',
    url: 'https://bsky.app/profile/christopherjm.ft.com',
    provenance: createProvenance('reported', undefined, 'FT Ukraine correspondent with government sources'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'steve-rosenberg',
    name: 'Steve Rosenberg',
    handle: '@bbcstever.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 90,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/bbcstever.bsky.social/rss',
    url: 'https://bsky.app/profile/bbcstever.bsky.social',
    provenance: createProvenance('reported', undefined, 'BBC Russia correspondent'),
    baselinePostsPerDay: 3,
  },
  {
    id: 'igor-bobic',
    name: 'Igor Bobic',
    handle: '@igorbobic.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 88,
    region: 'us-domestic' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/igorbobic.bsky.social/rss',
    url: 'https://bsky.app/profile/igorbobic.bsky.social',
    provenance: createProvenance('reported', undefined, 'HuffPost congressional reporter'),
    baselinePostsPerDay: 8,
  },
  // --- ISRAELI JOURNALISTS ---
  {
    id: 'barak-ravid',
    name: 'Barak Ravid',
    handle: '@barakravid.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 92,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/barakravid.bsky.social/rss',
    url: 'https://bsky.app/profile/barakravid.bsky.social',
    provenance: createProvenance('reported', undefined, 'Axios diplomatic correspondent, Israeli government sources'),
    baselinePostsPerDay: 8,
  },
  {
    id: 'emanuel-fabian',
    name: 'Emanuel Fabian',
    handle: '@manniefabian.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 90,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/manniefabian.bsky.social/rss',
    url: 'https://bsky.app/profile/manniefabian.bsky.social',
    provenance: createProvenance('reported', undefined, 'Times of Israel military correspondent, IDF sources'),
    baselinePostsPerDay: 15,
  },
  {
    id: 'avi-scharf',
    name: 'Avi Scharf',
    handle: '@avischarf.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 88,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/avischarf.bsky.social/rss',
    url: 'https://bsky.app/profile/avischarf.bsky.social',
    provenance: createProvenance('reported', undefined, 'Haaretz cartographic editor, satellite imagery'),
    baselinePostsPerDay: 5,
  },
  // --- UKRAINE JOURNALISTS ---
  {
    id: 'euan-macdonald',
    name: 'Euan MacDonald',
    handle: '@euanmacdonald.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 85,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/euanmacdonald.bsky.social/rss',
    url: 'https://bsky.app/profile/euanmacdonald.bsky.social',
    provenance: createProvenance('reported', undefined, 'Kyiv-based journalist, ground reporting'),
    baselinePostsPerDay: 20,
  },
];

// -----------------------------------------------------------------------------
// NEWS ORGANIZATIONS - News orgs citing sources
// -----------------------------------------------------------------------------
export const newsOrgs: (Source & { feedUrl: string })[] = [
  {
    id: 'ap-news',
    name: 'AP News',
    handle: '@apnews.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/apnews.com/rss',
    url: 'https://bsky.app/profile/apnews.com',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 50,
  },
  {
    id: 'aljazeera-bsky',
    name: 'Al Jazeera',
    handle: '@aljazeera.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 85,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/aljazeera.com/rss',
    url: 'https://bsky.app/profile/aljazeera.com',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 60,
  },
  // --- MIDDLE EAST NEWS ORGS ---
  {
    id: 'the-new-arab',
    name: 'The New Arab',
    handle: '@thenewarab.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 82,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/thenewarab.bsky.social/rss',
    url: 'https://bsky.app/profile/thenewarab.bsky.social',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 40,
  },
  // --- ISRAELI NEWS ORGS ---
  {
    id: 'haaretz',
    name: 'Haaretz',
    handle: '@haaretzcom.bsky.social',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 88,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/haaretzcom.bsky.social/rss',
    url: 'https://bsky.app/profile/haaretzcom.bsky.social',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 30,
  },
  {
    id: 'times-of-israel',
    name: 'Times of Israel',
    handle: '@timesofisrael.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 88,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/timesofisrael.com/rss',
    url: 'https://bsky.app/profile/timesofisrael.com',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 40,
  },
  {
    id: '972-magazine',
    name: '+972 Magazine',
    handle: '@972mag.com',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 82,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/972mag.com/rss',
    url: 'https://bsky.app/profile/972mag.com',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 5,
  },
  // --- UKRAINE NEWS ORGS ---
  {
    id: 'ukrainska-pravda',
    name: 'Ukrainska Pravda',
    handle: '@pravda.ua',
    platform: 'bluesky',
    tier: 'reporter',
    confidence: 85,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/pravda.ua/rss',
    url: 'https://bsky.app/profile/pravda.ua',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 50,
  },
];

// -----------------------------------------------------------------------------
// RSS FEEDS - Traditional news RSS
// -----------------------------------------------------------------------------
export const rssSources: (Source & { feedUrl: string })[] = [
  {
    id: 'bbc-world',
    name: 'BBC World',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'all' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    url: 'https://www.bbc.com/news/world',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 100,
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    platform: 'rss',
    tier: 'reporter',
    confidence: 80,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    url: 'https://www.aljazeera.com/',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 80,
  },
  {
    id: 'bbc-middle-east',
    name: 'BBC Middle East',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'middle-east' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    url: 'https://www.bbc.com/news/world/middle_east',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 30,
  },
  {
    id: 'bbc-europe',
    name: 'BBC Europe',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'ukraine-russia' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml',
    url: 'https://www.bbc.com/news/world/europe',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 25,
  },
  {
    id: 'bbc-asia',
    name: 'BBC Asia',
    platform: 'rss',
    tier: 'reporter',
    confidence: 90,
    region: 'china-taiwan' as WatchpointId,
    feedUrl: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    url: 'https://www.bbc.com/news/world/asia',
    provenance: provenanceTemplates.newsOrg,
    baselinePostsPerDay: 25,
  },
];

// -----------------------------------------------------------------------------
// GOVERNMENT & OFFICIAL SOURCES - Direct from governments and institutions
// -----------------------------------------------------------------------------
export const governmentSources: (Source & { feedUrl: string })[] = [
  // --- US GOVERNMENT ---
  {
    id: 'us-state-dept',
    name: 'US State Department',
    handle: '@state-department.bsky.social',
    platform: 'bluesky',
    tier: 'official',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/state-department.bsky.social/rss',
    url: 'https://bsky.app/profile/state-department.bsky.social',
    provenance: createProvenance('direct', undefined, 'Official US foreign policy statements'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'us-dhs',
    name: 'DHS Homeland Security',
    handle: '@homelandgov.bsky.social',
    platform: 'bluesky',
    tier: 'official',
    confidence: 95,
    region: 'us-domestic' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/homelandgov.bsky.social/rss',
    url: 'https://bsky.app/profile/homelandgov.bsky.social',
    provenance: createProvenance('direct', undefined, 'Official homeland security alerts and statements'),
    baselinePostsPerDay: 3,
  },
  // --- EARTHQUAKE ALERTS ---
  {
    id: 'usgs-earthquake',
    name: 'USGS Earthquakes',
    handle: '@earthquake.bsky.social',
    platform: 'bluesky',
    tier: 'official',
    confidence: 98,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/earthquake.bsky.social/rss',
    url: 'https://bsky.app/profile/earthquake.bsky.social',
    provenance: createProvenance('direct', undefined, 'Automated USGS earthquake alerts, 5.0+ magnitude'),
    baselinePostsPerDay: 10,
  },
  // --- INTERNATIONAL ORGANIZATIONS ---
  {
    id: 'who',
    name: 'WHO',
    handle: '@who.int',
    platform: 'bluesky',
    tier: 'official',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/who.int/rss',
    url: 'https://bsky.app/profile/who.int',
    provenance: createProvenance('direct', undefined, 'World Health Organization official alerts'),
    baselinePostsPerDay: 10,
  },
  {
    id: 'un-environment',
    name: 'UN Environment',
    handle: '@unep.org',
    platform: 'bluesky',
    tier: 'official',
    confidence: 92,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/unep.org/rss',
    url: 'https://bsky.app/profile/unep.org',
    provenance: createProvenance('direct', undefined, 'UN Environment Programme updates'),
    baselinePostsPerDay: 8,
  },
  // --- EUROPEAN UNION ---
  {
    id: 'eu-eeas',
    name: 'EU Diplomacy (EEAS)',
    handle: '@eudiplomacy.bsky.social',
    platform: 'bluesky',
    tier: 'official',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/eudiplomacy.bsky.social/rss',
    url: 'https://bsky.app/profile/eudiplomacy.bsky.social',
    provenance: createProvenance('direct', undefined, 'EU External Action Service - foreign policy'),
    baselinePostsPerDay: 5,
  },
  {
    id: 'eu-commission',
    name: 'European Commission',
    handle: '@ec.europa.eu',
    platform: 'bluesky',
    tier: 'official',
    confidence: 95,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/ec.europa.eu/rss',
    url: 'https://bsky.app/profile/ec.europa.eu',
    provenance: createProvenance('direct', undefined, 'European Commission official statements'),
    baselinePostsPerDay: 10,
  },
  {
    id: 'council-of-europe',
    name: 'Council of Europe',
    handle: '@coe.int',
    platform: 'bluesky',
    tier: 'official',
    confidence: 92,
    region: 'all' as WatchpointId,
    feedUrl: 'https://bsky.app/profile/coe.int/rss',
    url: 'https://bsky.app/profile/coe.int',
    provenance: createProvenance('direct', undefined, '46 countries - human rights, democracy, rule of law'),
    baselinePostsPerDay: 5,
  },
];

// =============================================================================
// ALL SOURCES - Ordered by provenance closeness to events
// =============================================================================
// Order: Government (direct) → Analysts → Aggregators → Reporters → News Orgs
export const allSources = [
  ...governmentSources,  // Official government sources (direct)
  ...osintAnalysts,      // Original analysis
  ...osintAggregators,   // Compile and amplify
  ...dataTrackers,       // Real-time data
  ...reporters,          // Journalists
  ...newsOrgs,           // News org social
  ...rssSources,         // News org RSS
];

// Legacy export for compatibility
export const blueskySources = [...osintAnalysts, ...osintAggregators, ...dataTrackers, ...reporters, ...newsOrgs];

// Get sources by region, maintaining priority order
export function getSourcesByRegion(region: WatchpointId) {
  if (region === 'all') return allSources;
  return allSources.filter((s) => s.region === region || s.region === 'all');
}

// Get sources by provenance type
export function getSourcesByProvenance(provenanceType: string) {
  return allSources.filter((s) => s.provenance.type === provenanceType);
}

// Get aggregators that amplify a specific type
export function getAggregatorsByTarget(target: string) {
  return allSources.filter(
    (s) => s.provenance.type === 'aggregated' && s.provenance.amplifies === target
  );
}

// Region keywords for classification
export const regionKeywords: Record<WatchpointId, string[]> = {
  'middle-east': [
    'iran', 'israel', 'gaza', 'palestinian', 'hamas', 'hezbollah',
    'lebanon', 'syria', 'iraq', 'saudi', 'yemen', 'houthi',
    'tehran', 'jerusalem', 'tel aviv', 'idf', 'irgc', 'strait of hormuz',
  ],
  'ukraine-russia': [
    'ukraine', 'russia', 'kyiv', 'moscow', 'crimea', 'donbas',
    'zelensky', 'putin', 'nato', 'kherson', 'bakhmut', 'avdiivka',
    'wagner', 'kursk', 'drone', 'frontline',
  ],
  'china-taiwan': [
    'taiwan', 'china', 'beijing', 'taipei', 'xi jinping',
    'south china sea', 'pla', 'strait', 'tsmc', 'semiconductors',
  ],
  'venezuela': [
    'venezuela', 'maduro', 'caracas', 'guaido', 'pdvsa',
    'colombian border', 'bolivarian',
  ],
  'us-domestic': [
    'washington', 'pentagon', 'white house', 'congress', 'senate',
    'biden', 'trump', 'state department', 'cia', 'fbi',
  ],
  all: [],
};

// Classify news item by region based on content
export function classifyRegion(title: string, content: string): WatchpointId {
  const text = `${title} ${content}`.toLowerCase();

  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (region === 'all') continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return region as WatchpointId;
    }
  }

  return 'all';
}

// Breaking news keywords - focused on geopolitical events
export const breakingKeywords = [
  'breaking:', 'urgent:', 'alert:', 'just in:', 'developing:',
  'explosion', 'airstrike', 'missile strike', 'rocket attack',
  'troops', 'military operation', 'invasion', 'declaration of war',
  'ceasefire', 'peace deal', 'hostage', 'assassination',
  'coup', 'martial law', 'state of emergency', 'sanctions',
  'nuclear', 'chemical weapons', 'biological weapons',
  'embassy', 'diplomat expelled', 'protests',
];

// Keywords that indicate NOT breaking (sports, entertainment, etc.)
const notBreakingKeywords = [
  'semifinal', 'final score', 'match', 'goal', 'tournament',
  'cup of nations', 'world cup', 'premier league', 'champions league',
  'nba', 'nfl', 'mlb', 'tennis', 'golf', 'cricket',
  'box office', 'movie', 'album', 'concert', 'celebrity',
  'recipe', 'weather forecast', 'stock market', 'earnings',
];

export function isBreakingNews(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();

  // First check if it's clearly NOT breaking (sports, entertainment)
  if (notBreakingKeywords.some((kw) => text.includes(kw))) {
    return false;
  }

  // Then check for actual breaking news indicators
  return breakingKeywords.some((kw) => text.includes(kw));
}
