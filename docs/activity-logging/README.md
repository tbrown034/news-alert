# Activity Logging System

This folder contains documentation for the post activity logging system used to calculate rolling averages for activity detection baselines.

## Purpose

Replace hardcoded/guessed `postsPerDay` values with measured data to accurately detect elevated vs normal activity levels.

## Components

- **Database Table**: `post_activity_logs` in Neon PostgreSQL
- **Logging Module**: `src/lib/activityLogging.ts`
- **API Endpoint**: `GET /api/analytics/activity`
- **Admin UI**: `/admin/activity`

## Files in this folder

- `README.md` - This overview
- `schema.sql` - Database schema
- `migration-log.md` - Migration history
- `verification-report.md` - Initial verification findings

## Timeline

- **Day 0**: Schema created, logging started
- **Day 2**: Initial averages visible (noisy)
- **Day 7**: Stable weekly patterns emerge
- **Day 14**: Full rolling average ready for production use
