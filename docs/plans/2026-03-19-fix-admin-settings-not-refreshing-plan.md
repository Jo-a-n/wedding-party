---
title: Admin changes don't refresh the live site
type: fix
status: active
date: 2026-03-19
---

# Admin changes don't refresh the live site

After saving settings (or hiding wishes/gallery items) in the admin panel, changes don't appear until you manually reload the page. The admin panel even says "Saved! Reload page to apply." — this should just work.

## Root Cause

The admin panel (`app/components/admin-panel.tsx`) is a `"use client"` component that receives `settings` as initial props from the server render. After a successful PUT to `/api/admin/settings`, it updates the database but does nothing to refresh the page's server-rendered data. The same pattern exists in the wish-wall and gallery components for hide/unhide actions.

The page itself has `export const dynamic = "force-dynamic"` so fresh visitors always get current data — the problem is only for the admin's own session after making changes.

## Fix

Call `router.refresh()` from Next.js `useRouter` after every successful admin mutation. This tells Next.js to re-run the server component tree without a full page reload, so all props get re-fetched from the database.

## Acceptance Criteria

- [ ] After saving datetimes in admin panel, page reflects new values without manual reload
- [ ] After hiding/unhiding a wish, the wish wall updates
- [ ] After hiding/unhiding a gallery item, the gallery updates
- [ ] Remove "Reload page to apply." message from admin panel

## Files to Change

### `app/components/admin-panel.tsx`
- Import `useRouter` from `next/navigation`
- Call `router.refresh()` after successful save
- Remove the "Reload page to apply." message

### Components that handle wish/gallery hide toggles
- Same pattern: call `router.refresh()` after successful PATCH calls
- Check `wish-wall.tsx` and `gallery-section.tsx` for admin toggle handlers
