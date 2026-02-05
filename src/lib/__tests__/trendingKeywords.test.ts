/**
 * Tests for trending keywords extraction
 * Run with: npx tsx --test src/lib/__tests__/trendingKeywords.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  extractKeywordsFromItem,
  countKeywords,
  getTrendingKeywords,
} from '../trendingKeywords';
import { NewsItem, Source } from '@/types';

// Helper to create mock NewsItem
function createMockItem(
  id: string,
  title: string,
  content: string = '',
  region: string = 'all'
): NewsItem {
  const source: Source = {
    id: 'test-source',
    name: 'Test Source',
    platform: 'rss',
    sourceType: 'news-org',
    confidence: 80,
    region: region as NewsItem['region'],
  };

  return {
    id,
    title,
    content,
    source,
    timestamp: new Date(),
    region: region as NewsItem['region'],
    verificationStatus: 'unverified',
  };
}

describe('extractKeywordsFromItem', () => {
  test('extracts keywords from title with Ukraine reference', () => {
    const item = createMockItem('1', 'Ukraine launches new offensive near Kyiv');
    const keywords = extractKeywordsFromItem(item);

    assert.ok(keywords.length > 0, 'Should extract at least one keyword');
    assert.ok(
      keywords.some((k) => k.toLowerCase().includes('ukrain') || k.toLowerCase().includes('kyiv')),
      'Should match Ukraine or Kyiv'
    );
  });

  test('extracts keywords from content as well', () => {
    const item = createMockItem(
      '2',
      'Breaking news today',
      'Putin addresses nation about military operations'
    );
    const keywords = extractKeywordsFromItem(item);

    assert.ok(
      keywords.some((k) => k.toLowerCase() === 'putin'),
      'Should match Putin from content'
    );
  });

  test('returns empty array when no keywords match', () => {
    const item = createMockItem('3', 'Local weather forecast for tomorrow');
    const keywords = extractKeywordsFromItem(item);

    assert.strictEqual(keywords.length, 0, 'Should return empty array for non-matching text');
  });

  test('extracts multiple keywords from multi-region text', () => {
    const item = createMockItem(
      '4',
      'Biden meets with Netanyahu to discuss Gaza situation and Iran sanctions'
    );
    const keywords = extractKeywordsFromItem(item);

    assert.ok(keywords.length >= 3, 'Should extract multiple keywords');
    // Should have US keywords (Biden) and Middle East keywords (Netanyahu, Gaza, Iran)
    const keywordsLower = keywords.map((k) => k.toLowerCase());
    assert.ok(keywordsLower.includes('biden'), 'Should include Biden');
    assert.ok(keywordsLower.includes('gaza'), 'Should include Gaza');
  });
});

describe('countKeywords', () => {
  test('counts keyword occurrences across items', () => {
    const items = [
      createMockItem('1', 'Ukraine offensive continues', '', 'europe-russia'),
      createMockItem('2', 'Ukraine aid package approved', '', 'europe-russia'),
      createMockItem('3', 'Gaza ceasefire talks resume', '', 'middle-east'),
    ];

    const counts = countKeywords(items);

    // Ukraine should appear twice
    const ukraineCount = counts.get('ukraine');
    assert.ok(ukraineCount, 'Should have Ukraine entry');
    assert.strictEqual(ukraineCount.count, 2, 'Ukraine should appear in 2 items');

    // Gaza should appear once
    const gazaCount = counts.get('gaza');
    assert.ok(gazaCount, 'Should have Gaza entry');
    assert.strictEqual(gazaCount.count, 1, 'Gaza should appear in 1 item');
  });

  test('does not double-count same keyword in one item', () => {
    const items = [
      createMockItem(
        '1',
        'Ukraine Ukraine Ukraine - multiple mentions',
        'More about Ukraine here',
        'europe-russia'
      ),
    ];

    const counts = countKeywords(items);
    const ukraineCount = counts.get('ukraine');

    assert.ok(ukraineCount, 'Should have Ukraine entry');
    assert.strictEqual(ukraineCount.count, 1, 'Should only count once per item');
  });

  test('tracks regions where keyword appeared', () => {
    const items = [
      createMockItem('1', 'NATO discusses Ukraine', '', 'europe-russia'),
      createMockItem('2', 'NATO meeting in Brussels', '', 'europe-russia'),
    ];

    const counts = countKeywords(items);
    const natoCount = counts.get('nato');

    assert.ok(natoCount, 'Should have NATO entry');
    assert.ok(natoCount.regions.has('europe-russia'), 'Should track region');
  });
});

describe('getTrendingKeywords', () => {
  test('returns keywords sorted by count (descending)', () => {
    const items = [
      createMockItem('1', 'Ukraine news', '', 'europe-russia'),
      createMockItem('2', 'Ukraine update', '', 'europe-russia'),
      createMockItem('3', 'Ukraine latest', '', 'europe-russia'),
      createMockItem('4', 'Gaza report', '', 'middle-east'),
    ];

    const result = getTrendingKeywords(items, 10);

    assert.ok(result.keywords.length > 0, 'Should return keywords');
    assert.strictEqual(result.keywords[0].keyword, 'Ukraine', 'Ukraine should be first (most frequent)');
    assert.strictEqual(result.keywords[0].count, 3, 'Ukraine count should be 3');
  });

  test('respects limit parameter', () => {
    const items = [
      createMockItem('1', 'Biden meets Netanyahu in Gaza talks about Iran', '', 'middle-east'),
      createMockItem('2', 'Ukraine Russia Kyiv Moscow NATO EU', '', 'europe-russia'),
    ];

    const result = getTrendingKeywords(items, 3);

    assert.ok(result.keywords.length <= 3, 'Should respect limit');
  });

  test('includes metadata about analysis', () => {
    const items = [
      createMockItem('1', 'Ukraine news', '', 'europe-russia'),
      createMockItem('2', 'Local weather', '', 'us'), // No keyword matches
    ];

    const result = getTrendingKeywords(items);

    assert.strictEqual(result.totalItemsAnalyzed, 2, 'Should report total items');
    assert.strictEqual(result.itemsWithMatches, 1, 'Should report items with matches');
  });

  test('handles empty input', () => {
    const result = getTrendingKeywords([]);

    assert.strictEqual(result.keywords.length, 0, 'Should return empty keywords');
    assert.strictEqual(result.totalItemsAnalyzed, 0, 'Should report 0 items');
  });
});

// Run tests
console.log('Running trending keywords tests...');
