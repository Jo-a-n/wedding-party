---
title: "feat: Upload Confirmation Overlay"
type: feat
status: completed
date: 2026-03-18
---

# Upload Confirmation Overlay

## Overview

Add a confirmation step between file selection and upload in the gallery. After selecting files via the native picker, guests see a modal overlay with thumbnail previews in a grid. Each file has a remove button. Action buttons (Cancel / Upload N) appear at both the **top and bottom** of the thumbnail section for easy access regardless of scroll position. This prevents accidental uploads and gives guests a chance to review their selection.

## Problem Statement / Motivation

Currently, files begin processing and uploading immediately after selection from the native file picker. Guests have no opportunity to review what they selected or remove unwanted files. On mobile (the primary audience), it's easy to accidentally select extra photos from the camera roll.

## Proposed Solution

Insert a new state between file selection and upload processing:

1. Guest clicks "Choose files" and selects files via native picker
2. **New:** A modal overlay appears showing a thumbnail grid of selected files
3. Each thumbnail has a remove (x) button
4. Cancel and "Upload N" buttons appear at **both top and bottom** of the grid
5. On confirm, the modal closes and the existing processing/upload pipeline runs
6. On cancel, all state is cleared

### UI Layout

```
┌──────────────────────────────────────┐
│  Review your files (3)               │
│  [ Cancel ]          [ Upload 3 ]    │
│                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │  img1  │  │  img2  │  │  vid1  │ │
│  │  .jpg  │  │  .png  │  │  .mov  │ │
│  │   ✕    │  │   ✕    │  │   ✕    │ │
│  └────────┘  └────────┘  └────────┘ │
│  ┌────────┐  ┌────────┐             │
│  │  img3  │  │  img4  │             │
│  │  .heic │  │  .jpg  │             │
│  │   ✕    │  │   ✕    │             │
│  └────────┘  └────────┘             │
│                                      │
│  [ Cancel ]          [ Upload 3 ]    │
└──────────────────────────────────────┘
```

- **Mobile (<640px):** Full-screen modal, 2-column grid, scrollable thumbnail area with sticky top/bottom button bars
- **Desktop (>=640px):** Centered dialog with backdrop, 3-column grid

## Technical Considerations

### Thumbnail Generation Strategy

- **Photos:** Use `URL.createObjectURL(file)` for instant preview via `<img>` tag. No processing needed.
- **HEIC photos:** Attempt `URL.createObjectURL` — works on Safari (primary iPhone audience) and Chrome 126+. Show a generic photo placeholder icon on browsers that can't render HEIC.
- **Videos:** Show a generic video icon with filename. Do **not** run `generateVideoThumbnail` at preview time — it's too slow (up to 10s per file) and the preview is meant to be instant.

### Validation Timing

Run `classifyFile()` and `validateFile()` **before** showing the modal. Files that fail validation (unsupported type, too large) are excluded from the preview grid and shown as inline errors below the file picker. Only valid files appear in the confirmation overlay.

### File Count Cap (>10 files)

If the user selects more than `MAX_FILES_PER_BATCH` (10), show a warning in the modal: "You selected N files but only 10 can be uploaded at a time." Show the first 10.

### Modal Close Behavior

When "Upload N" is clicked, the modal closes **immediately**. The existing inline progress UI in `GalleryUpload` handles the rest. No need to build progress tracking inside the modal.

### Memory Management

- Create object URLs on modal open
- Revoke all object URLs on modal close (confirm, cancel, or unmount)
- Use a `useEffect` cleanup to handle unmount edge case

### Mobile-Specific

- Full-screen modal on viewports under `sm` (640px) using `100dvh`
- 2-column grid with `aspect-square` thumbnails using `object-fit: cover`
- Scrollable thumbnail area between sticky top and bottom button bars
- Handle back button: push `history.pushState` on modal open, listen for `popstate` to close

### Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to heading
- Focus trap: Tab/Shift+Tab stays within modal
- Focus moves to modal on open, returns to "Choose files" button on close
- Escape key closes modal (same as Cancel)
- Remove buttons: `aria-label="Remove {filename}"`
- `body` gets `overflow: hidden` while modal is open

### Empty State

If the user removes all files, the "Upload" button becomes disabled. Show a message: "No files selected."

### "Add More" Files

Skipped for v1. User must cancel and re-select if they want different files. This avoids complexity with merging `FileList` objects.

## System-Wide Impact

- **Scope is contained:** Changes are limited to `gallery-upload.tsx` (and optionally a new `upload-confirmation-modal.tsx` component). No backend, API, or database changes.
- **No new dependencies required.** Uses native browser APIs (`URL.createObjectURL`, `history.pushState`).
- **Existing upload pipeline is untouched.** The confirmation step sits in front of `handleFiles` — once confirmed, the same sequential processing and upload flow runs.

## Acceptance Criteria

- [x] After selecting files, a modal overlay appears showing thumbnail previews
- [x] Each file has a visible remove (x) button
- [x] Cancel and "Upload N" buttons appear at **both top and bottom** of the thumbnail grid
- [x] Removing a file updates the count in the "Upload N" button text
- [x] Removing all files disables the Upload button
- [x] Cancel discards selection and closes modal
- [x] Upload closes modal and begins processing via existing pipeline
- [x] Invalid files (wrong type, too large) are filtered out before the modal with an inline error
- [x] If >10 files selected, show a warning about the cap
- [x] Modal is full-screen on mobile, centered dialog on desktop
- [x] Thumbnails are square-cropped with `object-fit: cover`
- [x] Object URLs are revoked on modal close (no memory leaks)
- [x] Modal has proper accessibility: `role="dialog"`, focus trap, Escape key, aria-labels
- [x] Back button on mobile closes the modal instead of navigating away
- [x] Body scroll is locked while modal is open

## Success Metrics

- Zero reports of accidental uploads from wedding guests
- No increase in upload abandonment (modal should be quick and intuitive)

## Dependencies & Risks

- **Timeline:** Gallery deadline is 2026-03-22. This needs to ship before then.
- **HEIC preview on Firefox:** Will show a placeholder icon. Acceptable since most guests will be on iPhone Safari or Chrome.
- **Risk:** Adding a step could slow down the happy path. Mitigated by keeping the modal fast (instant thumbnails, no processing).

## MVP Implementation Outline

### `app/components/upload-confirmation-modal.tsx` (new)

```tsx
// Props:
// - files: File[] — validated files to preview
// - onConfirm: (files: File[]) => void
// - onCancel: () => void

// State:
// - selectedFiles: File[] (initialized from props, allows removal)
// - objectUrls: Map<File, string> (created on mount, revoked on unmount)

// Renders:
// - Backdrop overlay
// - Modal container (full-screen on mobile, centered on desktop)
// - Header: "Review your files (N)"
// - Top action bar: [Cancel] [Upload N]
// - Scrollable thumbnail grid (2-col mobile, 3-col desktop)
//   - Each cell: square thumbnail + remove button overlay
//   - Videos: generic video icon + filename
// - Bottom action bar: [Cancel] [Upload N]

// Effects:
// - useEffect: create object URLs on mount, revoke on cleanup
// - useEffect: push history state on mount, popstate listener to close
// - useEffect: set body overflow hidden on mount, restore on cleanup
// - useEffect: focus trap setup
```

### `app/components/gallery-upload.tsx` (modified)

```tsx
// New state:
// - pendingFiles: File[] | null (files awaiting confirmation)

// Modified flow:
// 1. onChange handler: validate files, set pendingFiles (instead of calling handleFiles)
// 2. Render UploadConfirmationModal when pendingFiles is non-null
// 3. onConfirm: call handleFiles with confirmed files, clear pendingFiles
// 4. onCancel: clear pendingFiles, reset file input
```

## Sources & References

- Existing upload component: `app/components/gallery-upload.tsx`
- Media utilities: `lib/media-utils.ts`
- Gallery feature plan: `docs/plans/2026-03-17-feat-guest-photo-video-gallery-plan.md`
- HEIC/MOV fix plan: `docs/plans/2026-03-18-fix-heic-display-and-video-playback-plan.md`
