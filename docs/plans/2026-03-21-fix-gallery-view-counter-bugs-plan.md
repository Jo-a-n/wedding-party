---
title: Fix gallery view counter visibility and double-counting
type: fix
status: active
date: 2026-03-21
---

# Fix gallery view counter visibility and double-counting

## Problem

Two bugs with gallery view counters:

1. **Counters invisible on load** — `gallery-grid.tsx:86` renders the eye icon only when `item.view_count > 0`. Items with 0 views show nothing. The user wants counters always visible.

2. **Double-counting on open** — When a user clicks a photo, `handleItemClick` (`gallery-section.tsx:77-80`) calls `incrementViewCount(index)` and `setLightboxIndex(index)`. Then the Lightbox fires its `on.view` callback (`gallery-section.tsx:277-281`) on initial render. Because `lightboxIndex` in that closure is still the *previous* value (-1 or a different index), the guard `index !== lightboxIndex` passes, calling `incrementViewCount` a second time. Result: every open counts as 2 views.

## Fix

### Bug 1: Always show counter

**File:** `app/components/gallery-grid.tsx:86`

Change `{item.view_count > 0 && (` to just render unconditionally (remove the conditional). The eye icon + number shows for all items, even at 0.

### Bug 2: Prevent double increment

**File:** `app/components/gallery-section.tsx:76-82, 276-282`

Remove the `incrementViewCount` call from `handleItemClick`. Let the Lightbox `on.view` be the **sole** trigger for incrementing. This fires once on open (for the initial slide) and once per swipe — exactly one increment per view.

Alternatively, remove the `on.view` increment and keep only `handleItemClick`, but then swiping between photos in the lightbox won't count views. The `on.view`-only approach is better.

```tsx
// handleItemClick — only sets lightbox index, no increment
const handleItemClick = useCallback(
  (index: number) => {
    setLightboxIndex(index);
  },
  [],
);

// on.view — sole place that increments, remove stale-state guard
on={{
  view: ({ index }) => {
    incrementViewCount(index);
    setLightboxIndex(index);
  },
}}
```

Note: removing the `index !== lightboxIndex` guard is safe because the Lightbox only fires `on.view` when the visible slide actually changes.

## Acceptance Criteria

- [ ] Eye icon + view count visible on all gallery tiles, including those with 0 views
- [ ] Opening a photo increments view_count by exactly 1 (not 2)
- [ ] Swiping between photos in lightbox increments each by 1
- [ ] Realtime updates propagate view counts across all connected clients
