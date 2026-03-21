---
title: "fix: Mobile gallery shows single column instead of masonry"
type: fix
status: completed
date: 2026-03-21
---

# fix: Mobile gallery shows single column instead of masonry

## Overview

On mobile screens (≤500px), the image gallery renders one photo per row instead of a masonry grid. The `react-masonry-css` breakpoint config explicitly sets 1 column for viewports ≤500px. Changing this to 2 columns will restore the masonry effect on mobile.

## Problem Statement

The breakpoint config in `app/components/gallery-grid.tsx:14` is:

```ts
const MASONRY_BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,  // ← this causes single-column on mobile
};
```

Most mobile phones in portrait mode are 375–430px wide. With 1 column, each photo spans the full width, producing a vertical list instead of a staggered grid.

## Proposed Solution

Change the breakpoint so mobile always gets at least 2 columns:

### `app/components/gallery-grid.tsx`

```ts
const MASONRY_BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 2,  // was 1 → now 2 columns on mobile
};
```

Optionally reduce the gap for tighter mobile layouts in `app/globals.css` (currently 12px). A smaller gap (e.g. 8px) at narrow widths would give the tiles more room. This could be done with a media query:

```css
@media (max-width: 500px) {
  .gallery-masonry,
  .gallery-masonry-column {
    gap: 8px;
  }
}
```

## Acceptance Criteria

- [x] Gallery shows 2 columns on screens ≤500px
- [x] Photos are not cropped or distorted at the narrower column width
- [x] Gap between tiles looks balanced on small screens (consider reducing from 12px to 8px)
- [x] No horizontal overflow or layout shift on mobile

## Sources

- Breakpoint config: `app/components/gallery-grid.tsx:14`
- Masonry CSS: `app/globals.css:546-558`
- Library: `react-masonry-css` v1.0.16
