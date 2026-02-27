import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateRegionActivity, RegionActivity } from '../activityDetection';
import { WatchpointId } from '@/types';

// Helper to create test items for a region
function makeItems(region: WatchpointId, count: number): { region: WatchpointId; timestamp: Date }[] {
  return Array.from({ length: count }, (_, i) => ({
    region,
    timestamp: new Date(Date.now() - i * 60_000), // 1 minute apart
  }));
}

describe('calculateRegionActivity', () => {
  it('should return activity for all 5 tracked regions', async () => {
    const items = makeItems('us', 5);
    const activity = await calculateRegionActivity(items);

    const expectedRegions = ['us', 'latam', 'middle-east', 'europe-russia', 'asia'];
    for (const region of expectedRegions) {
      assert.ok(activity[region as WatchpointId], `Missing activity for ${region}`);
      assert.ok(['critical', 'elevated', 'normal'].includes(activity[region as WatchpointId].level));
    }
  });

  it('should return correct counts per region', async () => {
    const items = [
      ...makeItems('us', 10),
      ...makeItems('middle-east', 20),
      ...makeItems('europe-russia', 5),
    ];
    const activity = await calculateRegionActivity(items);

    assert.strictEqual(activity.us.count, 10);
    assert.strictEqual(activity['middle-east'].count, 20);
    assert.strictEqual(activity['europe-russia'].count, 5);
    assert.strictEqual(activity.latam.count, 0);
    assert.strictEqual(activity.asia.count, 0);
  });

  it('should always show NORMAL for excluded regions (LATAM, Asia)', async () => {
    // Even with massive item counts, LATAM and Asia should be NORMAL
    const items = [
      ...makeItems('latam', 200),
      ...makeItems('asia', 200),
    ];
    const activity = await calculateRegionActivity(items);

    assert.strictEqual(activity.latam.level, 'normal');
    assert.strictEqual(activity.asia.level, 'normal');

    // But counts should still be accurate
    assert.strictEqual(activity.latam.count, 200);
    assert.strictEqual(activity.asia.count, 200);
  });

  it('should have positive baselines for all regions', async () => {
    const activity = await calculateRegionActivity([]);

    const regions = ['us', 'latam', 'middle-east', 'europe-russia', 'asia'] as const;
    for (const region of regions) {
      assert.ok(activity[region].baseline > 0, `Baseline for ${region} should be positive, got ${activity[region].baseline}`);
    }
  });

  it('should calculate multiplier correctly', async () => {
    const items = makeItems('us', 10);
    const activity = await calculateRegionActivity(items);

    const expected = Math.round((10 / activity.us.baseline) * 10) / 10;
    assert.strictEqual(activity.us.multiplier, expected);
  });

  it('should set vsNormal correctly', async () => {
    const activity = await calculateRegionActivity([]);

    // With 0 items, multiplier should be 0 -> below normal
    const regions = ['us', 'middle-east', 'europe-russia'] as const;
    for (const region of regions) {
      if (activity[region].multiplier >= 1.5) {
        assert.strictEqual(activity[region].vsNormal, 'above');
      } else if (activity[region].multiplier <= 0.5) {
        assert.strictEqual(activity[region].vsNormal, 'below');
      } else {
        assert.strictEqual(activity[region].vsNormal, 'normal');
      }
    }
  });

  it('should not have a breaking field in the response', async () => {
    const activity = await calculateRegionActivity(makeItems('us', 5));
    const usActivity = activity.us as Record<string, unknown>;
    assert.strictEqual('breaking' in usActivity, false, 'breaking field should not exist');
  });

  it('should calculate percentChange correctly', async () => {
    const items = makeItems('us', 10);
    const activity = await calculateRegionActivity(items);

    const expected = Math.round(((10 - activity.us.baseline) / activity.us.baseline) * 100);
    assert.strictEqual(activity.us.percentChange, expected);
  });

  it('should require both multiplier AND count thresholds for elevated', async () => {
    // The elevated threshold is multiplier >= 2.5 AND count >= 25
    // If a region has very low baseline (say 5), even 15 items (3x) shouldn't trigger
    // elevated because count < 25
    const activity = await calculateRegionActivity(makeItems('us', 15));

    // Even if multiplier might be high, count must be >= 25
    if (activity.us.count < 25) {
      assert.strictEqual(activity.us.level, 'normal',
        `Should be normal with count=${activity.us.count} (< 25 threshold)`);
    }
  });
});
