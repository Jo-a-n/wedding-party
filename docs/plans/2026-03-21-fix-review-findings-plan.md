---
title: Fix Review Findings
type: fix
status: completed
date: 2026-03-21
---

# Fix Review Findings

Address bugs and issues identified in `docs/review-findings.md`. Prioritized by impact on wedding day guests.

## P1 — Must fix before wedding

### 1. Gallery "Load More" shows hidden items to guests

`app/components/gallery-section.tsx:197-201`

- [x] Add `.eq("hidden", false)` to the `handleLoadMore` query (matching the server-side fetch pattern in `page.tsx:89`)
- [x] Pass `isAdmin` into the load-more logic so admin still sees everything

### 2. Settings API GET has no auth check

`app/api/admin/settings/route.ts:4-18`

- [x] Add `verifyAdmin(req)` check to the `GET` handler
- [x] Note: this requires changing `GET()` signature to accept `req: Request`

### 3. XSS via innerHTML in upload modal

`app/components/upload-confirmation-modal.tsx:280-284`

- [x] Replace `innerHTML` with safe DOM construction using `textContent` for the filename

## P2 — Should fix

### 4. Countdown timer hydration mismatch

`app/components/countdown-timer.tsx:28`

- [x] Initialize `now` state to `0` or a sentinel value
- [x] Only start rendering the actual countdown after mount (useEffect sets the real `Date.now()`)
- [x] Show a placeholder or skeleton during SSR to avoid mismatch

### 5. `incrementViewCount` stale closure in lightbox

`app/components/gallery-section.tsx:60-77`

- [x] Change `incrementViewCount` to use a ref for items instead of depending on the `items` state directly
- [x] Or use `items[index]` via a ref callback pattern so the lightbox always reads current state

### 6. Double `URL.revokeObjectURL` in upload modal

`app/components/upload-confirmation-modal.tsx:42-43,126-127`

- [x] Remove the manual `revokeObjectURL` calls from `handleConfirm` and `handleCancel`
- [x] Let the `useEffect` cleanup handle revocation on unmount (single owner)

### 7. `deadline` missing from useEffect deps

`app/components/wish-wall.tsx:30` and `app/components/gallery-section.tsx:95`

- [x] Add `deadline` to the dependency arrays of both deadline-checking intervals

## P3 — Nice to have

### 8. Client-side rate limiting on rice tosses

`app/components/rice-celebration-section.tsx`

- [x] Add a simple cooldown (e.g. 200-300ms debounce) on `createBurst` to prevent spam
- [x] This is client-side only — not a security measure, just prevents accidental rapid-fire

### 9. Make wish submission truly optimistic

`app/components/wish-input.tsx:75-86`

- [x] Generate a temporary ID client-side and call `onOptimisticAdd` immediately before the DB insert
- [x] On success, reconcile the temp ID with the real one via the realtime subscription
- [x] On failure, remove the optimistic wish and show error

### 10. Reuse FFmpeg instance across batch

`lib/media-utils.ts:125-163`

- [x] Refactor `transcodeMovToMp4` to optionally accept an existing FFmpeg instance
- [x] In `gallery-upload.tsx`, create one instance for the batch and pass it to each call
- [x] Terminate after the batch completes

## Acceptance Criteria

- [x] Guest view never shows hidden gallery items (initial load or pagination)
- [x] `/api/admin/settings` GET returns 401 without admin header
- [x] No innerHTML usage with user-provided strings
- [x] No React hydration warnings in console
- [x] Lightbox view counts increment correctly when swiping
- [x] No double-revocation warnings in console during upload flow
