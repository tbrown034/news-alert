# Documentation Index

Quick reference for all project documentation.

---

## Active Docs (Use These)

| File | Purpose |
|------|---------|
| `SOURCE_GUIDELINES.md` | How to evaluate sources, Main Feed scoring, baselines |
| `FINAL_RSS_SOURCES.md` | Ready-to-use TypeScript code for RSS sources |
| `BLOCKLIST.md` | **Rejected sources** - check before evaluating |
| `sources.md` | Master research doc (Twitter, Telegram, Bluesky, APIs) |
| `devjournal.md` | Development log - update after significant work |
| `brainstorming.md` | Feature ideas and moat strategy |
| `planning.md` | Architecture decisions, MVP spec |
| `todo.md` | Task backlog |

---

## Workflow

### Adding a New Source

1. **Check blocklist first** (`BLOCKLIST.md`) - don't re-evaluate rejected sources
2. Evaluate using criteria in `SOURCE_GUIDELINES.md`
3. If rejected: add to `BLOCKLIST.md` and `src/lib/blocklist.ts`
4. If approved: add to `src/lib/sources.ts`

### Researching New Platforms

1. Document findings in `sources.md` (master research)
2. Test and verify feeds work
3. Add working sources to `FINAL_RSS_SOURCES.md` (if RSS)
4. Add to codebase in `src/lib/sources.ts`

---

## Archive (Reference Only)

These were intermediate research files used to build `FINAL_RSS_SOURCES.md`:

- `GOVERNMENT_SOURCES.md` - Government feeds research
- `THINKTANK_SOURCES.md` - Think tank feeds research
- `SUBSTACK_SOURCES.md` - Substack research
- `REGIONAL_SOURCES.md` - Regional news research
- `INVESTIGATIVE_SOURCES.md` - Investigative journalism research
- `DEFENSE_ENERGY_SOURCES.md` - Defense/energy research
- `WIRE_OSINT_SOURCES.md` - Wire services research
- `NEW_SOURCES.md` - Feed verification testing

These can be deleted once satisfied with FINAL_RSS_SOURCES.md.

---

## Quick Stats

| Platform | Sources | Status |
|----------|---------|--------|
| RSS | 437 | Active |
| Bluesky | ~150 | Active |
| Telegram | 0 | Researching |
| Twitter | 0 | Not pursuing |
