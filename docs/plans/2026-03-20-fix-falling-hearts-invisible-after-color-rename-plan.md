---
title: "fix: Falling hearts invisible after color variable rename"
type: fix
status: active
date: 2026-03-20
---

# fix: Falling hearts invisible after color variable rename

Hearts used to fall in the background but are no longer visible on any device (desktop or mobile). The root cause is commit `a1c5f53` ("colors") which renamed CSS custom properties but left stale references in the heart animation CSS.

## Root Cause

Commit `a1c5f53` replaced the color palette:

| Old variable     | New variable   | Old hex     | New hex     |
|-----------------|---------------|-------------|-------------|
| `--blush`       | `--jpink`     | `#f5d0e3`   | `#e789fa`   |
| `--periwinkle`  | `--jpurple`   | `#a1a2df`   | `#9946f7`   |

Four references were not updated:

| File | Line | Property | Stale var |
|------|------|----------|-----------|
| `app/globals.css` | 167 | `::selection` background | `var(--periwinkle)` |
| `app/globals.css` | 238 | `.heart-bg__heart` color (base) | `var(--blush)` |
| `app/globals.css` | 298 | `.heart-bg__heart` color (prefers-dark, dead code) | `var(--blush)` |
| `app/globals.css` | 326 | `.heart-bg__heart` color (data-theme=dark, **active rule**) | `var(--blush)` |

When `var(--blush)` is undefined, `color-mix()` produces an invalid value, the `color` property falls back to inherited `--foreground` (near-white `#f6f1ff`), and at `opacity: 0.48-0.72` the hearts become nearly invisible against the dark background.

The "not on mobile" report is the same underlying issue — hearts are invisible everywhere, not a mobile-specific bug.

## Acceptance Criteria

- [ ] Replace `var(--blush)` with `var(--jpink)` on lines 238, 298, 326 of `app/globals.css`
- [ ] Replace `var(--periwinkle)` with `var(--jpurple)` on line 167 of `app/globals.css`
- [ ] Hearts visibly fall on desktop (dark theme)
- [ ] Hearts visibly fall on mobile viewport
- [ ] Text selection highlight is visible site-wide

## Decision Needed: Color Choice

The new `--jpink` (`#e789fa`, vivid magenta) is a different hue from old `--blush` (`#f5d0e3`, pastel pink). Two options:

1. **Use `var(--jpink)`** — hearts adopt the new palette (recommended if the palette change was intentional)
2. **Hardcode `#f5d0e3`** — hearts keep original pastel pink regardless of palette

Note: the hardcoded `rgba(245, 208, 227, ...)` glow values in `.heart-bg__glow` and `text-shadow` still use old-palette colors. If option 1 is chosen, these could be updated as a follow-up for visual consistency, but they are not broken.

## Context

- Active CSS rule is the `data-theme="dark"` variant (line 326) since `layout.tsx` hardcodes `data-theme="dark"`
- The `@media (prefers-color-scheme: dark) :root:not([data-theme])` rule (line 298) is dead code but should still be fixed for correctness
- `prefers-reduced-motion` disables animations and shows static hearts at `opacity: 0.12` — unaffected by this bug
- No other stale variable references exist anywhere in the codebase (confirmed via grep)

## MVP

### app/globals.css

4 find-and-replace operations:

```css
/* Line 167: selection highlight */
/* Before: */ color-mix(in srgb, var(--periwinkle) 45%, white)
/* After:  */ color-mix(in srgb, var(--jpurple) 45%, white)

/* Line 238: base heart color */
/* Before: */ color-mix(in srgb, var(--blush) 84%, white 16%)
/* After:  */ color-mix(in srgb, var(--jpink) 84%, white 16%)

/* Line 298: prefers-dark heart color (dead code, fix for correctness) */
/* Before: */ color-mix(in srgb, var(--blush) 72%, white 28%)
/* After:  */ color-mix(in srgb, var(--jpink) 72%, white 28%)

/* Line 326: data-theme=dark heart color (ACTIVE RULE) */
/* Before: */ color-mix(in srgb, var(--blush) 72%, white 28%)
/* After:  */ color-mix(in srgb, var(--jpink) 72%, white 28%)
```

## Sources

- Broken by commit: `a1c5f53` ("colors")
- Component: `app/components/falling-hearts-background.tsx`
- Styles: `app/globals.css:196-344`
- Layout (theme): `app/layout.tsx:18`
