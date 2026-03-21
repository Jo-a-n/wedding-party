---
title: Large file upload redirect to Google Drive
type: feat
status: active
date: 2026-03-21
---

# Large file upload redirect to Google Drive

Files >= 100MB should not be rejected with a red error. Instead, show a friendly message directing the user to upload via a Google Drive/Photos album link.

## Acceptance Criteria

- [ ] Files >= 100MB trigger a distinct redirect message (not a red error) with the album link
- [ ] The Google Drive/Photos link is stored in `site_settings` as `large_upload_album_url`
- [ ] Link opens in a new tab
- [ ] Message is in Greek, consistent with the rest of the UI
- [ ] If the link is not yet configured, show a fallback message (no dead link)
- [ ] Mixed selections work: valid files still go to the confirmation modal, oversized files get the redirect message shown inside the modal as a banner
- [ ] File names of oversized files are listed in the message

## Context

### Current validation flow

`handleFileSelection` in `gallery-upload.tsx` (line 209) iterates files, calls `classifyFile()` then `validateFile()` from `lib/media-utils.ts`. Current limits: photos 20MB, videos 100MB. Errors show as red `<p>` tags below the upload button.

### Key files

| File | What to change |
|------|----------------|
| `lib/media-utils.ts:3-4` | Add `LARGE_FILE_REDIRECT_MB = 100` constant |
| `app/components/gallery-upload.tsx:209` | Add pre-check in `handleFileSelection` — before `validateFile`, check if `file.size >= 100MB`. Route those files into a new `oversizedFiles` array instead of `validationErrors` |
| `app/components/gallery-upload.tsx` | Pass `oversizedFiles` + album URL to `UploadConfirmationModal` |
| `app/components/upload-confirmation-modal.tsx` | Render a visually distinct banner (amber/info style, not red) above the thumbnail grid listing oversized file names + Drive link |
| `app/components/gallery-section.tsx` | Fetch `large_upload_album_url` from `site_settings` and pass it down |

### Design decisions

- **100MB check as pre-check in component, not inside `validateFile`** — the redirect is a UX concern, not a validation rule. Keeps `media-utils.ts` focused on file validation.
- **Store link in `site_settings`** — the admin API already exists at `/api/admin/settings`. Avoids hardcoding and doesn't require a redeploy to set the link.
- **Redirect banner inside the confirmation modal** — when a user selects a mix of valid and oversized files, they see everything in one place: valid files ready to upload + a banner for the oversized ones with the Drive link.
- **Lazy fetch of the album URL** — only fetch when an oversized file is detected, not on every page load.

### Edge case: photos 20-100MB

Photos between 20-100MB currently get rejected by `validateFile` before compression runs, even though `compressImage` would bring them well under 20MB. This is a separate latent bug — not in scope here, but worth noting. The 100MB redirect only applies to files >= 100MB.

## MVP

### gallery-upload.tsx — handleFileSelection changes

```tsx
// New constant
const LARGE_FILE_REDIRECT_BYTES = 100 * 1024 * 1024; // 100MB

// Inside handleFileSelection, before validateFile:
const oversizedForDrive: File[] = [];

for (const file of files) {
  if (file.size >= LARGE_FILE_REDIRECT_BYTES) {
    oversizedForDrive.push(file);
    continue; // skip normal validation
  }
  // ... existing classify + validate logic
}

// Pass oversizedForDrive to modal alongside validFiles
```

### upload-confirmation-modal.tsx — banner

```tsx
{oversizedFiles.length > 0 && (
  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-[14px] text-amber-900">
    <p className="font-[500]">
      {oversizedFiles.length === 1
        ? "Ένα αρχείο είναι πολύ μεγάλο για ανέβασμα εδώ:"
        : `${oversizedFiles.length} αρχεία είναι πολύ μεγάλα για ανέβασμα εδώ:`}
    </p>
    <ul className="mt-1 list-disc pl-4">
      {oversizedFiles.map((f) => (
        <li key={f.name}>{f.name} ({(f.size / (1024*1024)).toFixed(0)} MB)</li>
      ))}
    </ul>
    {albumUrl ? (
      <p className="mt-2">
        Ανεβάστε τα στο{" "}
        <a href={albumUrl} target="_blank" rel="noopener noreferrer"
           className="underline font-[500]">
          Google Photos album
        </a>{" "}
        μας.
      </p>
    ) : (
      <p className="mt-2">Ο σύνδεσμος για ανέβασμα μεγάλων αρχείων θα είναι διαθέσιμος σύντομα.</p>
    )}
  </div>
)}
```

## Sources

- Upload component: `app/components/gallery-upload.tsx`
- Validation utils: `lib/media-utils.ts`
- Confirmation modal: `app/components/upload-confirmation-modal.tsx`
- Site settings: `site_settings` table, fetched in `gallery-section.tsx`
