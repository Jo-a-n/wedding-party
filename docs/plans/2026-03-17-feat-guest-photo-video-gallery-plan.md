---
title: "feat: Guest Photo & Video Gallery"
type: feat
status: active
date: 2026-03-17
---

# Guest Photo & Video Gallery

## Overview

Add a photo/video gallery section to the wedding app where guests can upload media from their phones, displayed in a masonry layout with fullscreen lightbox viewing. Standalone from the wish wall — guests upload media independently. Supports realtime updates so everyone sees new uploads live.

## Problem Statement / Motivation

Guests capture photos and videos throughout the wedding but they end up scattered across phones and messaging apps. A shared gallery on the wedding site gives everyone a single place to contribute and browse — creating a collaborative album in real time.

## Proposed Solution

A new "Photo Album" section on the existing single-page layout (below the wish wall) with:

1. **Upload form** — file picker + camera capture, with client-side image compression
2. **Masonry grid** — responsive tile layout showing all uploads
3. **Fullscreen lightbox** — click any tile to view full-size with swipe/keyboard navigation
4. **Realtime** — new uploads from other guests appear live (same pattern as wish wall)
5. **Time-gating** — uploads close after the same deadline as the wish wall

### New Dependencies (3 packages, ~45KB gzipped total)

| Package | Purpose | Size |
|---------|---------|------|
| `browser-image-compression` | Client-side image resize/compress before upload | ~28KB gz |
| `react-masonry-css` | CSS-column masonry layout | ~2KB gz |
| `yet-another-react-lightbox` | Fullscreen lightbox with swipe, keyboard, video support | ~15KB gz |

## Technical Approach

### Database: `gallery_items` table

```sql
create table public.gallery_items (
  id          bigint generated always as identity primary key,
  file_path   text not null,
  media_type  text not null check (media_type in ('photo', 'video')),
  thumb_path  text,
  width       int,
  height      int,
  guest_name  text default '' check (char_length(guest_name) <= 100),
  created_at  timestamptz not null default now()
);

create index gallery_items_created_at_desc on public.gallery_items (created_at desc);

alter table public.gallery_items enable row level security;

create policy "Anyone can view gallery"
  on public.gallery_items for select to anon, authenticated
  using (true);

create policy "Anyone can add to gallery"
  on public.gallery_items for insert to anon, authenticated
  with check (true);

alter publication supabase_realtime add table public.gallery_items;
```

### Storage: `gallery` bucket

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery', 'gallery', true,
  104857600,  -- 100MB (videos)
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm']
);

-- Anyone can read
create policy "Public gallery read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'gallery');

-- Anyone can upload
create policy "Public gallery upload"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'gallery');
```

No UPDATE or DELETE policies — guests cannot overwrite or remove files.

### `next.config.ts` — remote image patterns

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'njctehzeyosgiundxzgz.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

### Upload Flow

1. Guest selects files (file picker or camera capture via `<input accept="image/*,video/*">`; omit `capture` attr so OS offers both front/back camera choice)
2. **Photos**: run through `browser-image-compression` (max 1920px, target ~1MB, JPEG output) — this also strips EXIF/GPS data and handles orientation. Always compress regardless of file size to ensure EXIF stripping.
3. **HEIC handling**: `browser-image-compression` accepts HEIC on browsers that can decode it (Safari, iOS). On Chrome/Firefox, HEIC decoding isn't supported — show a friendly error asking the guest to re-take or share as JPEG. In practice, iPhones sharing via Safari will work; this edge case is rare.
4. **Videos**: validate format (MP4/MOV/WebM) and size (max 100MB). Generate thumbnail client-side via Canvas API at 1 second mark. If thumbnail generation fails (e.g. H.265 codec in Chrome), use a generic video placeholder.
5. Generate unique filename: `{Date.now()}-{crypto.randomUUID()}.{ext}`
6. Upload to Supabase Storage with progress tracking
7. Extract image dimensions via `createImageBitmap()` (photos) or video element (videos)
8. Insert row into `gallery_items` with metadata
9. Optimistic add to local gallery state (same pattern as wish wall)

### Multi-File Upload

- Sequential uploads (not parallel) to avoid saturating mobile connections
- Per-file progress indicator
- If one file fails, others continue
- Max ~10 files per batch (client-side limit for UX sanity)
- Upload button disabled during active upload, re-enabled after batch completes

### Gallery Display

**Masonry layout** via `react-masonry-css`:
- Breakpoints: 4 columns (desktop), 3 columns (tablet), 2 columns (mobile), 1 column (narrow)
- Each tile shows the photo or video thumbnail with rounded corners
- Video tiles get a play icon overlay
- Optional guest name shown on tile (subtle overlay)
- New items animate in (same `wish-card-enter` style animation)

**Pagination**: Load first 50 items server-side, then "Load more" button to fetch next batch. Don't load everything at once — could be hundreds of uploads.

**Lazy loading**: Native `loading="lazy"` + `decoding="async"` on images. First ~8 visible images load eagerly.

### Lightbox

`yet-another-react-lightbox` with:
- Photo: full-resolution image
- Video: inline `<video>` with controls, `playsInline` for iOS
- Swipe gestures on mobile, arrow keys + Escape on desktop
- Backdrop click to close
- Navigation between items (prev/next)

### Realtime

Subscribe to `gallery_items` INSERT events (same pattern as `wish-wall.tsx`):
- New uploads from other guests appear at the top of the grid
- Deduplicate by `id` against optimistic adds

### Time-Gating

Same deadline as wish wall: `2026-03-22T11:00:00+03:00` (EEST). After deadline:
- Upload form hides
- Gallery remains viewable (read-only)
- Check every 60 seconds (same pattern as wish wall)

## New Files

```
app/components/
  gallery-section.tsx      -- Main section: upload form + masonry grid + lightbox state
  gallery-upload.tsx       -- Upload form: file picker, compression, progress indicators
  gallery-grid.tsx         -- Masonry grid with tiles, lazy loading, "load more"
lib/
  media-utils.ts           -- compress image, generate video thumbnail, get dimensions
```

The lightbox is a thin wrapper around `yet-another-react-lightbox` — inline in `gallery-section.tsx`, not a separate file. Individual tiles are simple enough to live inside `gallery-grid.tsx`.

## Acceptance Criteria

- [x] Guest can upload photos from file picker or camera
- [x] Guest can upload videos (MP4/MOV, up to 100MB)
- [x] Photos are compressed client-side before upload (max 1920px, ~1MB target)
- [x] HEIC photos from iPhones are converted to JPEG
- [x] Upload shows progress indicator per file
- [x] Gallery displays in responsive masonry layout (4/3/2/1 columns)
- [x] Clicking a tile opens fullscreen lightbox
- [x] Lightbox supports swipe gestures and keyboard navigation
- [x] Videos play inline in lightbox with controls
- [x] New uploads from other guests appear in real time
- [x] Upload form hides after the deadline (same as wish wall)
- [x] Gallery loads first 50 items with "Load more" for pagination
- [x] Images lazy-load below the fold
- [x] Dark mode support (matching existing design system)
- [x] Respects `prefers-reduced-motion` for animations
- [x] Works on iPhone Safari and Android Chrome
- [x] Optional guest name field (pre-populated from wish draft in localStorage)
- [x] EXIF/GPS data stripped from uploaded photos (compression always runs)
- [x] Supabase bucket enforces MIME type and file size limits server-side
- [x] Graceful error when HEIC can't be decoded (non-Safari browsers)

## Success Metrics

- Guests can upload and view photos/videos without friction on mobile
- Gallery loads fast even with 200+ items (pagination + lazy loading)
- No broken thumbnails or failed video playback on common devices

## Dependencies & Risks

**Dependencies:**
- Supabase Storage bucket must be created (SQL in this plan)
- `gallery_items` table must be created
- `next.config.ts` needs `remotePatterns` for Supabase images

**Risks:**
- **iPhone MOV/H.265 videos**: Won't play in Chrome/Firefox. Mitigation: accept MOV uploads, generate thumbnail; playback degrades gracefully with a "download" fallback if browser can't play the codec. Most guests viewing on phones will be on Safari (iPhone) or Chrome (Android with H.264 MP4).
- **Storage quota**: Free tier = 1GB. With compression (~1MB/photo), that's ~1000 photos or ~10 uncompressed videos. If on free tier, may need to monitor. Pro tier (100GB) has no practical limit.
- **Abuse**: Anonymous uploads mean anyone with the URL can upload. Acceptable risk for a small wedding audience. Couple can delete via Supabase dashboard if needed.
- **Timeline**: Wedding is March 21 (4 days). This is a medium-sized feature but well-scoped with libraries handling the heavy lifting.

## Sources & References

- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets)
- [browser-image-compression (npm)](https://www.npmjs.com/package/browser-image-compression)
- [react-masonry-css (GitHub)](https://github.com/paulcollett/react-masonry-css)
- [yet-another-react-lightbox](https://yet-another-react-lightbox.com/)
- Existing patterns: `app/components/wish-wall.tsx` (realtime), `app/components/wish-input.tsx` (form + optimistic add)
- Existing schema: `docs/supabase-schema.sql`
