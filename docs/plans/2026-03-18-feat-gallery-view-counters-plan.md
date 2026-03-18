---
title: "feat: Add view counters for gallery photos and videos"
type: feat
status: completed
date: 2026-03-18
---

# Add view counters for gallery photos and videos

Track how many times each photo/video has been opened in the fullscreen lightbox, and display the count on each gallery tile.

## Acceptance Criteria

- [x] Each time a guest opens a photo/video in the lightbox, the view count increments by 1
- [x] No deduplication — every lightbox open = +1 view
- [x] View counts are displayed on each gallery tile (small overlay, e.g. eye icon + number)
- [x] View counts update in realtime (via Supabase Realtime on UPDATE events)
- [x] Initial view counts are fetched with the gallery items on page load

## Context

**Trigger:** Lightbox open (not scroll-into-view). When `onItemClick` fires in `gallery-section.tsx`, we increment the count.

**Existing pattern:** The rice toss counter (`rice_tosses` table + realtime) is the closest analog, but view counts are better as a column on `gallery_items` since they're 1:1 with items, not standalone events.

**RLS consideration:** `gallery_items` currently has no UPDATE policy. We need a Supabase RPC function to safely increment just the `view_count` column without opening up full row updates.

## MVP

### 1. Database migration

Add `view_count` column and an RPC to increment it:

```sql
-- Add view_count column (defaults to 0 for existing rows)
alter table public.gallery_items
  add column view_count int not null default 0;

-- RPC function to atomically increment view count
create or replace function public.increment_view_count(item_id bigint)
returns void
language sql
security definer
as $$
  update public.gallery_items
  set view_count = view_count + 1
  where id = item_id;
$$;
```

Update `docs/supabase-schema.sql` with the new column and function.

### 2. TypeScript types — `lib/supabase/types.ts`

Add `view_count: number` to the `GalleryItem` type.

### 3. Increment on lightbox open — `app/components/gallery-section.tsx`

When `onItemClick` fires (setting `lightboxIndex`), also call the RPC:

```typescript
const handleItemClick = useCallback((index: number) => {
  setLightboxIndex(index);
  const item = items[index];
  if (item) {
    const supabase = createClient();
    supabase.rpc("increment_view_count", { item_id: item.id });
  }
}, [items]);
```

Also update `items` state optimistically: `item.view_count += 1`.

### 4. Realtime UPDATE subscription — `app/components/gallery-section.tsx`

Add an UPDATE listener alongside the existing INSERT listener on `gallery_items`:

```typescript
.on(
  "postgres_changes",
  { event: "UPDATE", schema: "public", table: "gallery_items" },
  (payload) => {
    const updated = payload.new as unknown as GalleryItem;
    setItems((prev) =>
      prev.map((item) =>
        item.id === updated.id ? { ...item, view_count: updated.view_count } : item
      )
    );
  },
)
```

### 5. Display view count on tile — `app/components/gallery-grid.tsx`

Add a small overlay to `GalleryTile` showing the view count (eye icon + number), positioned in the top-right corner:

```tsx
{item.view_count > 0 && (
  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white/90">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    {item.view_count}
  </div>
)}
```

## Sources

- Existing counter pattern: `app/components/rice-celebration-section.tsx`
- Gallery section (lightbox + realtime): `app/components/gallery-section.tsx`
- Gallery grid (tile rendering): `app/components/gallery-grid.tsx`
- DB schema: `docs/supabase-schema.sql`
- Supabase types: `lib/supabase/types.ts`
