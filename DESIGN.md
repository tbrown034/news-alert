# Pulse Design System

Single source of truth for all UI decisions. Read this before touching any component.

---

## Philosophy

Pulse is an **editorial intelligence dashboard** — part newsroom tool, part wire service. Its aesthetic descends from the same lineage as Trevor's portfolio (trevorthewebdeveloper.com): **journalistic credibility meets technical precision**. The design should feel like it was built by someone who writes headlines and ships code.

**Identity:**
- Serif headlines + sans-serif data = the "copy + code" metaphor from the portfolio
- Grayscale foundation with **one accent color per context** (cyan for AI/system, amber for alerts, severity reds/oranges for status). Never a rainbow.
- Information density with clarity — show more, scroll less, but never clutter

**Principles:**
1. **Restraint** — one way to do each thing. No "creative" per-component styling. If there's a pattern, follow it.
2. **Hierarchy through type, not decoration** — serif headlines create contrast without needing color or borders
3. **Consistent interaction language** — every hover, every click, every transition follows the same rules. Inconsistent interactions feel broken even when they work.
4. **Mobile-first, always** — if it breaks at 390px, it ships broken
5. **Dark-first** — dark mode is the default. Light mode must work but dark is primary
6. **Earn your pixels** — every element must justify its existence. No decorative borders, no gratuitous icons, no filler text

---

## Typography

### Scale (defined in `globals.css`)

| Class | Mobile | Desktop (640px+) | Weight | Family | Use for |
|-------|--------|-------------------|--------|--------|---------|
| `.text-display` | 28px | 36px | 700 | Serif | Page titles only |
| `.text-subhead` | 18px | 20px | 600 | Serif | Section headers (e.g., "Live Wire", "Global Monitor") |
| `.text-title` | 15px | 16px | 500 | Serif | News headlines in cards |
| `.text-body` | 15px | 16px | 400 | Sans | Body text, summaries, descriptions |
| `.text-label` | 13px | 14px | 500 | Sans | Source names, tab labels, metadata |
| `.text-caption` | 12px | 12px | 400 | Sans | Timestamps, secondary metadata |
| `.text-2xs` / `.text-micro` | 11px | 11px | 500 | Sans | Badges, multipliers, compact labels |

### Rules
- **Never use raw Tailwind sizes** (`text-sm`, `text-xs`, `text-lg`) for content text. Use the scale above.
- **Serif** = headlines and section titles only. Everything else is sans.
- **`font-semibold`** for emphasis within body text. **`font-bold`** only in `.text-display` and `.text-subhead`.
- **`tabular-nums`** on any numeric data (counts, multipliers, times).

---

## Colors

### Use CSS Variables (never hardcode)

| Variable | Light | Dark | Use for |
|----------|-------|------|---------|
| `--background` | `#edeff2` | `#000000` | Page background |
| `--background-secondary` | `#e4e7eb` | `#0a0a0a` | Subtle backgrounds, hover states |
| `--background-card` | `#ffffff` | `#111111` | Card backgrounds |
| `--foreground` | `#1a1a1a` | `#f0f0f0` | Primary text |
| `--foreground-muted` | `#6b7280` | `#888888` | Secondary text, labels |
| `--foreground-light` | `#748391` | `#737373` | Tertiary text, placeholders (3.89:1 / 3.98:1 — AA-large) |
| `--border` | `#e0e3e8` | `#222222` | Default borders |
| `--border-light` | `#eceef1` | `#1a1a1a` | Subtle dividers |
| `--border-card` | `#e0e3e8` | `#222222` | Card borders |

### Semantic Colors

| Variable | Light | Dark | Use for |
|----------|-------|------|---------|
| `--color-critical` | `#dc2626` | `#ef4444` | Critical/surging activity, alerts |
| `--color-elevated` | `#ea580c` | `#f97316` | Elevated activity, warnings |
| `--color-success` | `#059669` | `#10b981` | Normal activity, confirmed status |
| `--color-info` | `#6c757d` | `#9ca3af` | Informational, neutral |

### When Tailwind `dark:` prefix is OK
- **Severity-specific colors** that don't map to CSS vars (e.g., `text-red-600 dark:text-red-400`)
- **Map hardcoded colors** (SVG fills that can't use CSS vars)
- **Never** for backgrounds, borders, or primary text — use CSS variables for those

### Region Accent Colors

| Region | Color | Tailwind class |
|--------|-------|----------------|
| US | Indigo | `border-l-indigo-500` |
| Latin America | Emerald | `border-l-emerald-500` |
| Middle East | Amber | `border-l-amber-500` |
| Europe-Russia | Sky | `border-l-sky-500` |
| Asia-Pacific | Rose | `border-l-rose-500` |
| Africa | Orange | `border-l-orange-500` |

---

## Spacing

### Scale

| Token | Value | Tailwind |
|-------|-------|----------|
| xs | 4px | `gap-1`, `p-1` |
| sm | 8px | `gap-2`, `p-2` |
| md | 12px | `gap-3`, `p-3` |
| lg | 16px | `gap-4`, `p-4` |
| xl | 24px | `gap-6`, `p-6` |
| 2xl | 32px | `gap-8`, `p-8` |

### Allowed off-scale values
These are intentional half-steps, not bugs:
- `gap-0.5` (2px) — icon-to-text tight pairing
- `gap-1.5` (6px) — compact list items
- `py-2.5` (10px) — compact card padding (mobile)
- `p-5` (20px) — card section padding (between lg and xl)

### Standard patterns

| Context | Mobile | Desktop (sm+) |
|---------|--------|---------------|
| Page padding | `px-3 sm:px-4` or `px-4 sm:px-6` | |
| Card padding | `px-3 py-2.5 sm:px-4 sm:py-3` | |
| Card section padding | `px-4 sm:px-5 py-4` | |
| Section spacing | `space-y-6` | |
| Inline element gap | `gap-2` | |
| Tight element gap | `gap-1` or `gap-1.5` | |

---

## Cards

### Standard card
```
bg-background-card rounded-xl border border-border-card shadow-card
```
A `.card` class is defined in globals.css — use it or replicate exactly. **Never** use `rounded-2xl` or `rounded-lg` for cards.

### Card header (when card has distinct header/body)
```
px-4 sm:px-5 py-3 border-b border-border-light
```

### Card body
```
px-4 sm:px-5 py-4
```

---

## Buttons

### Primary (rare — main CTA only)
```
px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors
```

### Secondary (most buttons)
```
px-2.5 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground bg-background-secondary rounded-lg transition-colors
```

### Ghost / text button
```
text-foreground-muted hover:text-foreground transition-colors
```
No background, no border. For inline actions (Details, Refresh, etc.)

### Rules
- **Hover state**: change one property only (bg OR text color, not both)
- **Border radius**: `rounded-lg` for all buttons
- **Never** `rounded-full` on action buttons (only on avatar/badge elements)
- **Icon + text**: `inline-flex items-center gap-1`

---

## Interaction Language

Every interactive element must follow these patterns. No exceptions. Inconsistent hover/focus behavior feels broken even when functional.

### Hover patterns (pick ONE per element type)
| Element type | Hover behavior | Example |
|---|---|---|
| Text links / ghost buttons | Text color: muted -> foreground | `text-foreground-muted hover:text-foreground` |
| Filled buttons | Background shifts lighter | `bg-cyan-600 hover:bg-cyan-500` |
| Cards (clickable) | Border color shift + subtle shadow | `hover:border-border hover:shadow-md` |
| Tab / pill selectors | Background appears | `hover:bg-background-secondary` |

### Focus
```
focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
```
Same on every focusable element. No ring-offset variations.

### Active / pressed
No special active state needed. The 200ms global transition handles the snap-back naturally.

### Disabled
```
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Icons

### Library: Heroicons v2 (outline for UI, solid for status)

### Size scale

| Size | Tailwind | Use for |
|------|----------|---------|
| 12px | `w-3 h-3` | Inline with `.text-2xs`, chevrons in compact buttons |
| 14px | `w-3.5 h-3.5` | Inline with `.text-caption`, secondary actions |
| 16px | `w-4 h-4` | Standard icon size — most buttons, cards, nav |
| 20px | `w-5 h-5` | Header nav icons, standalone buttons |

### Rules
- **Match icon size to adjacent text size**: `.text-caption` pairs with `w-3.5`, `.text-label` pairs with `w-4`
- **Color**: inherit from parent text color. Never hardcode icon color unless it's a status indicator
- **Status indicators** (dots, not icons): `w-2 h-2 rounded-full` with semantic color

---

## Badges

### Standard badge
```
inline-flex text-2xs font-semibold px-1.5 py-0.5 rounded-md
```

### Region badge
```
rounded-full  (always pill-shaped for region tags)
```

### Severity badge
```
badge-critical: bg-[--color-critical-muted] text-[--color-critical]
badge-elevated: bg-[--color-elevated-muted] text-[--color-elevated]
badge-success:  bg-[--color-success-muted] text-[--color-success]
badge-info:     bg-[--color-info-muted] text-[--foreground-muted]
```

---

## Animations

### Duration scale
| Speed | Duration | Use for |
|-------|----------|---------|
| Fast | 200ms | Hover states, color changes (global default) |
| Standard | 300ms | Element enter/exit, reveals |
| Slow | 600ms | Page transitions, large reveals |

### Rules
- **Global transition** (200ms) handles hover/focus automatically. Don't add extra `transition-*` unless you need a different property or duration.
- **Entry animations**: `news-item-enter` (400ms) for feed items. Stagger with 30ms increments.
- **Loading**: Use `animate-pulse` for skeleton states. Use `animate-spin` for spinners.
- **Never animate layout properties** (width, height, padding) — use transform and opacity only.

---

## Responsive

### Breakpoints
- **Mobile**: < 640px (base styles)
- **Desktop**: >= 640px (`sm:` prefix)
- **Rarely used**: `md:` (768px), `lg:` (1024px)

### Max-width strategy
| Page type | Max-width | Why |
|-----------|-----------|-----|
| Content pages (About, Profile) | `max-w-3xl` (768px) | Readable line length |
| Data pages (Conditions, News) | `max-w-5xl` (1024px) | More room for data |
| Home (map + feed) | `max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl` | Progressive |

### Rules
- **Test every UI change at 390px width** before shipping
- **`overflow-hidden`** on card wrappers to prevent inner content from causing page-level horizontal scroll
- **Scrollable regions** (tab bars, etc.) use `overflow-x-auto` inside an `overflow-hidden` parent

---

## Dark Mode

### Approach
1. CSS variables switch via `.dark` class on `<html>`
2. Default is dark. Light mode is opt-in via toggle.
3. **Preferred**: use CSS variable classes (`bg-background-card`, `text-foreground-muted`)
4. **Acceptable**: `dark:` prefix for severity colors that aren't in CSS vars
5. **Never**: hardcode `bg-slate-*`, `text-gray-*`, `bg-black`, `bg-white` for themed elements

---

## Known Violations (to fix)

| Component | Issue | Fix |
|-----------|-------|-----|
| Admin page | Hardcoded `bg-slate-50 dark:bg-black` | Use CSS vars |
| Profile page | `rounded-2xl` on card | Change to `rounded-xl` |
| Legend.tsx | Hardcoded `hover:bg-gray-100 dark:hover:bg-slate-700` | Use CSS vars |
| EditorialCard | Full hardcoded color system with `dark:` prefix | Migrate to CSS vars where possible |
| Map components | Hardcoded hex colors for SVG fills | Accept (SVG limitation) but document |
| Header.tsx | `bg-black` hardcoded for logo | Accept (brand element) |
| PlatformIcon | Hardcoded colors with `dark:` prefix | Accept (platform brand colors) |
| Focus rings | Hardcoded `ring-blue-500` | Should use `ring-[var(--color-info)]` or similar |

---

## Checklist: Before Shipping UI Changes

1. Does it work at 390px? (screenshot or browser resize to verify)
2. Does it use CSS variables for bg/text/border? (no hardcoded slate/gray)
3. Does text use the type scale? (no raw `text-sm`, `text-lg`)
4. Are buttons styled per the button spec above?
5. Are icons sized per the icon scale?
6. Does the card use `rounded-xl` and `border-border-card`?
7. Does `overflow-hidden` contain any scrollable inner elements?
8. Light mode and dark mode both look correct?
