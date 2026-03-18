---
title: "feat: Handwritten guestbook-style wish wall"
type: feat
status: active
date: 2026-03-18
---

# Handwritten Guestbook-Style Wish Wall

## Overview

Transform the wishes section from card-based display into a guestbook/journal aesthetic where each wish appears as if handwritten on the page. Remove card frames, assign different handwritten Google Fonts per wish, apply slight rotations, and let the layout breathe like an open book.

## Problem Statement / Motivation

The current wish wall uses uniform `soft-card` containers with colored accent headers. While functional, this feels generic and "app-like." A guestbook metaphor — handwritten text, slight tilts, varied penmanship — creates a more personal, warm feeling that matches the wedding context.

## Proposed Solution

### Font Selection (7 fonts, cycling via `wish.id % 7`)

| # | Font | Style | Weight Config |
|---|------|-------|---------------|
| 1 | **Caveat** | Relaxed cursive, slightly slanted | Variable weight (no `weight` needed) |
| 2 | **Patrick Hand** | Clean print-style, upright | `weight: '400'` |
| 3 | **Shadows Into Light** | Monoline, gentle journal feel | `weight: '400'` |
| 4 | **Kalam** | Brush-influenced, warm rounded strokes | Variable weight |
| 5 | **Indie Flower** | Loopy, bubbly, cheerful | `weight: '400'` |
| 6 | **Architects Daughter** | Architectural lettering, creative | `weight: '400'` |
| 7 | **Handlee** | Simple, clean, approachable | `weight: '400'` |

**Greek character support:** Most handwritten Google Fonts lack Greek glyphs. Caveat supports `cyrillic` but not `greek`. The plan: load `subsets: ['latin']` and let Greek text fall back to the site's system font stack. This actually looks natural — like someone switching between a decorative pen and normal writing. Since many wishes will be in Greek, the handwritten aesthetic will come primarily from **rotation, spacing, and layout** rather than font alone. Latin-alphabet wishes (English names, "congratulations") will get the full handwritten treatment.

> **Alternative considered:** Restrict to only Greek-supporting fonts. Rejected because the pool is too small (essentially just Dancing Script) and the variety would be lost.

### Layout Changes

**Keep the responsive grid** (`grid gap-6 sm:grid-cols-2 lg:grid-cols-3`) but:

- Remove `soft-card` class (no background, no border)
- Remove the colored accent header bar
- Increase gap from `gap-4` to `gap-6` for breathing room
- Add generous padding per wish item so rotated corners don't overlap neighbors

### Rotation Strategy

Fixed rotation array indexed by `wish.id % length`:

```typescript
const ROTATIONS = [-2, 1.5, -1, 2.5, -0.5, 1.8, -1.5] // degrees
```

- Use the CSS `rotate` property (not `transform: rotate()`) so it composes independently with the entrance `translate` animation
- On mobile (`max-sm`), halve the rotation values to prevent horizontal overflow
- Add `overflow-x: hidden` on the wish wall container as a safety net

### Author Name Treatment

Replace the colored accent header with a signature-style line below the message:

```
"Wishing you all the happiness in the world!"
                                    — Maria
```

- Name in the same handwritten font as the message
- Right-aligned or indented, prefixed with em-dash
- Slightly smaller size than the message
- Remove the timestamp from display (guestbooks don't show time)

### Entrance Animation Fix

The current `wish-card-enter` animation uses `transform: translateY(12px)`. Since we're using the separate `rotate` CSS property, the entrance animation's `transform` won't conflict. No wrapper element needed.

```css
.wish-card-enter {
  animation: wish-enter 0.4s ease-out;
}

@keyframes wish-enter {
  from { opacity: 0; translate: 0 12px; }
  to { opacity: 0; translate: 0 0; }
}
```

Use `translate` property instead of `transform: translateY()` for clean composition with `rotate`.

### Dark Mode

Accept that the paper metaphor is stronger in light mode. In dark mode:
- Wishes render on the existing dark surface without card frames (same as light mode approach)
- Handwritten fonts still work on dark backgrounds — think chalkboard or dark journal
- Optionally add a very subtle warm-tinted background per wish (`rgba(255, 248, 240, 0.03)`) to hint at paper

### Empty State

Update the empty state to match the guestbook theme:
- Replace envelope emoji with a subtle pen/quill or open book reference
- Text: "The guestbook is open — be the first to write"

### Input Form

Keep the input form styling as-is (`soft-card-strong`). The form is a functional UI element; the guestbook metaphor applies only to submitted wishes. Adding handwritten fonts to input fields creates usability issues.

## Technical Approach

### Font Loading (`app/fonts.ts` — new file)

```typescript
import {
  Caveat, Patrick_Hand, Shadows_Into_Light,
  Kalam, Indie_Flower, Architects_Daughter, Handlee,
} from 'next/font/google'

export const wishFonts = [
  Caveat({ subsets: ['latin'], variable: '--font-wish-0', display: 'swap' }),
  Patrick_Hand({ weight: '400', subsets: ['latin'], variable: '--font-wish-1', display: 'swap' }),
  Shadows_Into_Light({ weight: '400', subsets: ['latin'], variable: '--font-wish-2', display: 'swap' }),
  Kalam({ weight: '400', subsets: ['latin'], variable: '--font-wish-3', display: 'swap' }),
  Indie_Flower({ weight: '400', subsets: ['latin'], variable: '--font-wish-4', display: 'swap' }),
  Architects_Daughter({ weight: '400', subsets: ['latin'], variable: '--font-wish-5', display: 'swap' }),
  Handlee({ weight: '400', subsets: ['latin'], variable: '--font-wish-6', display: 'swap' }),
]
```

### Layout Changes (`layout.tsx`)

Add all font CSS variable classes to `<html>`:

```tsx
<html className={`${wishFonts.map(f => f.variable).join(' ')} ...existing`}>
```

### CSS (`globals.css`)

```css
/* Wish handwriting fonts */
.wish-font-0 { font-family: var(--font-wish-0), var(--font-sans); }
.wish-font-1 { font-family: var(--font-wish-1), var(--font-sans); }
.wish-font-2 { font-family: var(--font-wish-2), var(--font-sans); }
.wish-font-3 { font-family: var(--font-wish-3), var(--font-sans); }
.wish-font-4 { font-family: var(--font-wish-4), var(--font-sans); }
.wish-font-5 { font-family: var(--font-wish-5), var(--font-sans); }
.wish-font-6 { font-family: var(--font-wish-6), var(--font-sans); }
```

### Component Changes

**`wish-card.tsx`:**
- Remove `soft-card` class, accent color header, timestamp
- Add `wish-font-{id % 7}` class
- Add inline `rotate: {ROTATIONS[id % 7]}deg` style
- Move name below message with em-dash prefix, right-aligned
- Increase font size slightly for message (`text-base` instead of `text-sm`) since handwritten fonts need room

**`wish-wall.tsx`:**
- Increase grid gap to `gap-6`
- Add `overflow-x-hidden` to container
- Add padding to compensate for rotation overflow

## Acceptance Criteria

- [ ] 7 handwritten Google Fonts loaded via `next/font/google` with `display: swap`
- [ ] Each wish gets a deterministic font based on `wish.id % 7`
- [ ] Each wish gets a deterministic slight rotation (-2.5° to +2.5° range)
- [ ] Card frames (background, border, accent header) removed
- [ ] Author name displayed as signature below message
- [ ] Timestamp hidden from display
- [ ] No horizontal scrollbar on any viewport width
- [ ] Entrance animation still works for realtime wishes
- [ ] Dark mode renders cleanly
- [ ] `prefers-reduced-motion` still respected for entrance animation (static rotation is fine)
- [ ] Empty state updated to match guestbook theme
- [ ] Input form unchanged

## Performance Notes

- Each Latin-subset handwritten font is ~15-30KB (woff2). Total: ~100-200KB.
- `next/font/google` self-hosts fonts at build time — no runtime requests to Google.
- `display: swap` ensures text renders immediately with fallback, then swaps.
- All 7 fonts load in parallel and are cached after first visit.
- Consider setting `preload: false` on 4 of 7 fonts if initial load is noticeably impacted.

## Files to Modify

| File | Changes |
|------|---------|
| `app/fonts.ts` | **New** — define all 7 wish fonts |
| `app/layout.tsx` | Add font CSS variables to `<html>` |
| `app/globals.css` | Add `.wish-font-*` classes, update `wish-card-enter` animation to use `translate` |
| `app/components/wish-card.tsx` | Remove card chrome, add font/rotation, restyle name as signature |
| `app/components/wish-wall.tsx` | Increase gap, add overflow handling, update empty state |
