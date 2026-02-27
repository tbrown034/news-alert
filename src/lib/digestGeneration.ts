/**
 * AI NEWS DIGEST GENERATION
 * =========================
 * Generates editorial digests from mainstream news articles using Claude.
 * Called by Vercel cron (4x/day) and stored in PostgreSQL for instant serving.
 *
 * Uses Claude Haiku 4.5 for cost efficiency (~$0.01 per digest).
 * Each digest covers a 6-hour window of articles from /api/mainstream.
 */

import Anthropic from '@anthropic-ai/sdk';
import { query, queryOne } from './db';
import type { DigestStory, NewsDigest } from '@/types';

// Re-export types for convenience
export type { DigestStory, NewsDigest } from '@/types';

// DB row shape (snake_case from PostgreSQL)
interface DigestRow {
  id: string;
  headline: string;
  summary: string;
  stories: DigestStory[];
  articles_analyzed: number;
  time_window_start: Date;
  time_window_end: Date;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: string; // NUMERIC comes back as string from pg
  created_at: Date;
  is_active: boolean;
}

// Internal article structure for Claude input
interface ArticleInput {
  id: number;
  source: string;
  title: string;
  content?: string;
  region: string;
  timestamp: string; // relative, e.g. "2h ago"
}

// Model pricing per 1M tokens
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
};

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// =============================================================================
// ROW CONVERSION
// =============================================================================

function rowToDigest(row: DigestRow): NewsDigest {
  // JSONB comes back parsed from pg, but guard against string edge cases
  const stories = typeof row.stories === 'string'
    ? JSON.parse(row.stories) : row.stories;

  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary,
    stories,
    articlesAnalyzed: row.articles_analyzed,
    timeWindowStart: row.time_window_start.toISOString(),
    timeWindowEnd: row.time_window_end.toISOString(),
    model: row.model,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costUsd: parseFloat(row.cost_usd),
    createdAt: row.created_at.toISOString(),
  };
}

// =============================================================================
// ARTICLE FETCHING
// =============================================================================

/**
 * Fetch mainstream articles from the internal API.
 * Uses localhost in server context (cron job runs on same instance).
 */
async function fetchMainstreamArticles(): Promise<ArticleInput[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const url = `${baseUrl}/api/mainstream?region=all&hours=6&topN=10`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PulseDigest/1.0 (internal cron)' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Digest] Mainstream API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const now = Date.now();
    const articles: ArticleInput[] = [];
    let idx = 0;

    for (const group of data.sources || []) {
      for (const article of group.articles || []) {
        const ts = new Date(article.timestamp).getTime();
        const diffMs = now - ts;
        const diffMins = Math.floor(diffMs / 60000);

        let relativeTime: string;
        if (diffMins < 60) relativeTime = `${diffMins}m ago`;
        else if (diffMins < 1440) relativeTime = `${Math.floor(diffMins / 60)}h ago`;
        else relativeTime = `${Math.floor(diffMins / 1440)}d ago`;

        articles.push({
          id: ++idx,
          source: group.sourceName,
          title: article.title || '',
          content: article.content && article.content !== article.title
            ? article.content.slice(0, 300)
            : undefined,
          region: article.region || group.sourceRegion || 'all',
          timestamp: relativeTime,
        });
      }
    }

    // Sort by recency (most recent first based on original timestamp)
    // Articles are already sorted from the API, just return them
    return articles;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Digest] Mainstream fetch timed out');
    } else {
      console.error('[Digest] Mainstream fetch error:', error);
    }
    return [];
  }
}

// =============================================================================
// PROMPT
// =============================================================================

function buildDigestPrompt(articles: ArticleInput[]): string {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const currentTimeStr = now.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

  const startTimeStr = windowStart.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const articlesJson = JSON.stringify(articles);

  return `You are a senior wire editor at a global intelligence news service. You're writing the digest that will appear at the top of the page — the "above the fold" summary that tells readers what matters right now.

Current time: ${currentTimeStr}
Coverage window: ${startTimeStr} to now (6 hours)
Articles analyzed: ${articles.length}

<articles>
${articlesJson}
</articles>

Write an editorial digest as JSON:
{
  "headline": "One compelling headline that captures the dominant story or theme of this period (max 12 words). Write like a newspaper front page.",
  "summary": "2-3 sentences giving readers the big picture. What's the state of the world right now? What changed in this window? Write with authority and context, not just what happened but why it matters.",
  "stories": [
    {
      "title": "Concise headline for this story (5-10 words)",
      "summary": "2-3 sentences. What happened, who's involved, why it matters. Add context a reader needs. Be specific — names, numbers, places.",
      "sources": ["Source Name 1", "Source Name 2"],
      "region": "us|middle-east|europe-russia|asia|latam|africa|global",
      "importance": "high|medium"
    }
  ]
}

Rules:
- Select 4-7 stories, ranked by importance (most important first)
- PRIORITIZE stories reported by multiple sources — this is a strong importance signal
- High importance: major geopolitical events, military action, natural disasters, market-moving events, heads of state actions
- Medium importance: significant policy changes, diplomatic developments, ongoing situations with new developments
- Skip routine stories (scheduled press conferences, minor policy announcements, sports, entertainment)
- Each story must cite at least one source by name
- The headline should be specific and informative, not clickbait
- Write in plain text — no markdown, no bold, no italics, no bullet points
- Reference time naturally (this morning, overnight, in the last few hours)
- If multiple articles cover the same event, MERGE them into one story and list all sources
- Region should reflect where the story is happening, not where the source is based. Use "global" only for truly worldwide stories (market crashes, pandemic developments, etc.)`;
}

// =============================================================================
// GENERATION
// =============================================================================

export async function generateDigest(
  model: string = DEFAULT_MODEL,
): Promise<NewsDigest | null> {
  const startTime = Date.now();
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 6 * 60 * 60 * 1000);

  // 1. Fetch articles
  const articles = await fetchMainstreamArticles();

  if (articles.length < 3) {
    console.log(`[Digest] Only ${articles.length} articles — skipping generation`);
    return null;
  }

  console.log(`[Digest] Generating from ${articles.length} articles using ${model}`);

  // 2. Build prompt
  const prompt = buildDigestPrompt(articles);

  // 3. Call Claude with streaming (avoids Vercel timeout)
  const client = new Anthropic();
  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  let fullText = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
    }
  }

  const finalMessage = await stream.finalMessage();
  const latencyMs = Date.now() - startTime;

  // 4. Parse response
  const inputTokens = finalMessage.usage?.input_tokens || 0;
  const outputTokens = finalMessage.usage?.output_tokens || 0;
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  const costUsd = Math.round(
    ((inputTokens * pricing.input / 1_000_000) +
     (outputTokens * pricing.output / 1_000_000)) * 100000
  ) / 100000;

  // Extract JSON (handle markdown code blocks if present)
  let jsonStr = fullText;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr.trim());
  } catch (err) {
    console.error('[Digest] Failed to parse Claude response:', err);
    console.error('[Digest] Raw response:', fullText.slice(0, 500));
    return null;
  }

  // Validate required fields
  if (!parsed.headline || !parsed.summary || !Array.isArray(parsed.stories)) {
    console.error('[Digest] Invalid digest structure:', Object.keys(parsed));
    return null;
  }

  // Normalize stories (cap at 10, normalize region values)
  const stories: DigestStory[] = parsed.stories.slice(0, 10).map((s: any) => ({
    title: s.title || '',
    summary: s.summary || '',
    sources: Array.isArray(s.sources) ? s.sources : [],
    region: s.region === 'global' ? 'all' : (s.region || 'all'),
    importance: s.importance === 'high' ? 'high' : 'medium',
  }));

  console.log(`[Digest] Generated: "${parsed.headline}" — ${stories.length} stories, ${inputTokens}+${outputTokens} tokens, $${costUsd.toFixed(4)}, ${latencyMs}ms`);

  // 5. Save to database
  const digest = await saveDigest({
    headline: parsed.headline,
    summary: parsed.summary,
    stories,
    articlesAnalyzed: articles.length,
    timeWindowStart: windowStart.toISOString(),
    timeWindowEnd: windowEnd.toISOString(),
    model,
    inputTokens,
    outputTokens,
    costUsd,
  });

  return digest;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

interface SaveDigestInput {
  headline: string;
  summary: string;
  stories: DigestStory[];
  articlesAnalyzed: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function saveDigest(input: SaveDigestInput): Promise<NewsDigest> {
  const row = await queryOne<DigestRow>(
    `INSERT INTO news_digests (
      headline, summary, stories, articles_analyzed,
      time_window_start, time_window_end,
      model, input_tokens, output_tokens, cost_usd
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      input.headline,
      input.summary,
      JSON.stringify(input.stories),
      input.articlesAnalyzed,
      input.timeWindowStart,
      input.timeWindowEnd,
      input.model,
      input.inputTokens,
      input.outputTokens,
      input.costUsd,
    ]
  );

  if (!row) {
    throw new Error('Failed to save digest');
  }

  return rowToDigest(row);
}

/**
 * Get the most recent active digest
 */
export async function getLatestDigest(): Promise<NewsDigest | null> {
  const row = await queryOne<DigestRow>(
    `SELECT * FROM news_digests
     WHERE is_active = TRUE
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return row ? rowToDigest(row) : null;
}

/**
 * Get recent digests (for history/archive)
 */
export async function getRecentDigests(limit: number = 4): Promise<NewsDigest[]> {
  const rows = await query<DigestRow>(
    `SELECT * FROM news_digests
     WHERE is_active = TRUE
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(rowToDigest);
}
