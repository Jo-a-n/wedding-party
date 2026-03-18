---
title: Fix HEIC display and MOV video playback in gallery
type: fix
status: active
date: 2026-03-18
---

# Fix HEIC Display and MOV Video Playback in Gallery

## Overview

Two cross-browser bugs in the guest photo gallery:

1. **HEIC images not displaying on Chrome** — raw `.heic` files are uploaded when `browser-image-compression` fails, and Chrome can't render them as `<img>` tags.
2. **iPhone MOV videos not playing on Chrome** — H.265/HEVC encoded `.mov` files are uploaded as-is, and Chrome can't decode them in `<video>` elements.

Both issues stem from the same root cause: relying on browser-native codec support without a conversion fallback.

## Problem Statement / Motivation

Wedding guests will upload photos and videos from iPhones (HEIC photos, MOV/H.265 video). Other guests viewing the gallery on Chrome or Firefox see broken images and unplayable videos. Since this is a one-time event, every broken upload is a lost moment.

**Current behavior:**
- `compressImage()` in `lib/media-utils.ts:33-46` catches compression failures and silently returns the original HEIC file
- `gallery-upload.tsx:117-138` detects `wasCompressed = false` and uploads with original MIME type (`image/heic`)
- `gallery-grid.tsx:43-49` renders `<img src="...heic">` — broken on Chrome/Firefox
- `gallery-section.tsx:107-133` sets MIME type `video/quicktime` for `.mov` — Chrome can't play H.265

## Proposed Solution

**Both fixes are client-side — no server changes needed.**

### Bug 1: HEIC → JPEG conversion with `heic2any`

Before passing to `browser-image-compression`, detect HEIC files and convert to JPEG using the `heic2any` library (wraps libheif via WASM). Dynamic import to avoid adding ~200KB to the main bundle for non-HEIC uploads.

**Flow:**
1. Detect HEIC: check `file.type` includes `heic` or `heif`, OR file extension is `.heic`/`.heif`
2. Dynamic `import('heic2any')`
3. Convert to JPEG blob
4. Create a new `File` from the blob (preserving name with `.jpg` extension)
5. Pass to existing `compressImage()` — which now receives a JPEG it can compress
6. If `heic2any` fails → show user-facing error ("Couldn't process this image. Try converting to JPEG first.")

### Bug 2: MOV → MP4 transcoding with `@ffmpeg/ffmpeg`

Before uploading video, detect MOV/H.265 files and transcode to H.264 MP4 using FFmpeg compiled to WebAssembly.

**Flow:**
1. Detect MOV: check `file.type === 'video/quicktime'` OR extension is `.mov`
2. Dynamic `import('@ffmpeg/ffmpeg')` and `import('@ffmpeg/util')`
3. Load FFmpeg WASM core
4. Transcode: `ffmpeg.exec(['-i', 'input.mov', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', 'output.mp4'])`
5. Return the MP4 blob as a new `File`
6. Upload as `video/mp4` — playable everywhere
7. Show transcoding progress in the upload UI (FFmpeg.wasm supports progress callbacks)
8. If transcoding fails → show error with option to retry or skip

**UX note:** FFmpeg.wasm transcoding takes 30s–2min depending on video length and device. The upload status should show "Converting video..." with an indication that this is expected to take a moment.

## Technical Considerations

### Architecture

- **No server-side changes** — everything is client-side conversion before upload
- **No database schema changes** — files are stored as JPEG/MP4 from the start
- **Dynamic imports** — both `heic2any` (~200KB) and `@ffmpeg/ffmpeg` (~30MB core loaded on demand) are loaded only when needed
- **FFmpeg.wasm requires `SharedArrayBuffer`** — needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Isolation` headers. Check if Next.js config already sets these, or add them.

### Key files to modify

| File | Changes |
|---|---|
| `lib/media-utils.ts` | Add `convertHeicToJpeg()`, `transcodeMov()` functions |
| `app/components/gallery-upload.tsx` | Call HEIC conversion before compression; call MOV transcoding before video upload; update progress states |
| `package.json` | Add `heic2any`, `@ffmpeg/ffmpeg`, `@ffmpeg/util` dependencies |
| `next.config.ts` | Add COOP/COEP headers if needed for SharedArrayBuffer |

### Performance implications

- **HEIC conversion**: 1–3 seconds on modern devices, negligible
- **MOV transcoding**: 30s–2min, significant — must communicate to user
- **Bundle size**: Both libraries are dynamically imported, zero impact on initial page load
- **Memory**: FFmpeg.wasm can use 200MB+ for large videos. The 100MB upload limit helps bound this.

### Security considerations

- FFmpeg.wasm runs in a sandboxed WASM environment — no filesystem access beyond what's provided
- `SharedArrayBuffer` requires cross-origin isolation headers, which restricts some third-party embeds (verify no Supabase auth popups are affected)

## System-Wide Impact

- **Cross-origin isolation headers**: Adding COOP/COEP headers affects the entire site. Verify that Supabase auth, analytics, and any other third-party scripts still work.
- **Upload flow change**: The conversion steps add time before the actual Supabase upload. The existing sequential upload loop in `gallery-upload.tsx:194-196` will be slower for MOV files.
- **Lightbox MIME type logic**: `gallery-section.tsx:114-118` can be simplified since all videos will be MP4 after this fix. But keep backward compat for any existing `.mov` entries.

## Acceptance Criteria

### Bug 1: HEIC

- [x] HEIC photo uploaded from Chrome is converted to JPEG and displays correctly in the gallery grid
- [x] HEIC photo uploaded from Safari continues to work (existing path)
- [x] If `heic2any` conversion fails, user sees a clear error message (not a silent broken image)
- [x] `heic2any` is dynamically imported only when a HEIC file is detected
- [x] Non-HEIC images (JPEG, PNG, WebP) are unaffected

### Bug 2: MOV Video

- [x] iPhone MOV video uploaded from Chrome is transcoded to MP4 and plays in lightbox
- [x] MOV video uploaded from Safari continues to work (Safari can play H.265 natively, but transcoding is still applied for consistency — all stored as MP4)
- [x] Upload UI shows "Converting video..." during transcoding with appropriate timing expectation
- [x] If FFmpeg.wasm transcoding fails, user sees a clear error with option to retry
- [x] MP4 videos (already H.264) skip transcoding and upload directly
- [x] `@ffmpeg/ffmpeg` is dynamically imported only when a MOV file is detected

### Backfill

- [ ] Existing broken HEIC images are identified and manually re-uploaded as JPEG (or a script converts them)
- [ ] Existing unplayable MOV videos are identified and transcoded (manual or script)

## Success Metrics

- Zero broken images visible in the gallery on Chrome
- All videos playable in the lightbox on Chrome
- Upload completion rate stays above 95% (conversion errors should be rare)

## Dependencies & Risks

| Risk | Impact | Mitigation |
|---|---|---|
| FFmpeg.wasm `SharedArrayBuffer` requires COOP/COEP headers | Could break third-party integrations | Test thoroughly; fall back to single-threaded mode if needed |
| FFmpeg.wasm is slow on older phones | Bad UX for video uploads | Show clear progress; consider max video duration limit |
| `heic2any` can't handle all HEIC variants | Some photos fail to convert | Show clear error; suggest converting to JPEG on device |
| FFmpeg.wasm core is ~30MB download | First MOV upload is slow to start | Show "Loading converter..." state; core is cached after first load |
| Cross-origin isolation breaks Supabase auth | Auth stops working | Test auth flow with headers; use `credentialless` COEP if needed |

## MVP Implementation

### lib/media-utils.ts

Add two new functions:

```typescript
// lib/media-utils.ts

export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.includes("heic") || type.includes("heif")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
}

export function isMov(file: File): boolean {
  if (file.type === "video/quicktime") return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "mov";
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  return new File([resultBlob], file.name.replace(/\.heic$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

export async function transcodeMovToMp4(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => onProgress(Math.round(progress * 100)));
  }

  await ffmpeg.load();
  await ffmpeg.writeFile("input.mov", await fetchFile(file));
  await ffmpeg.exec([
    "-i", "input.mov",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac",
    "-movflags", "+faststart",
    "output.mp4",
  ]);

  const data = await ffmpeg.readFile("output.mp4");
  const mp4Blob = new Blob([data], { type: "video/mp4" });
  return new File([mp4Blob], file.name.replace(/\.mov$/i, ".mp4"), {
    type: "video/mp4",
  });
}
```

### app/components/gallery-upload.tsx

Update `processFile` to call conversion before upload:

```typescript
// gallery-upload.tsx — inside processFile()

// Photos: convert HEIC if needed, then compress
if (mediaType === "photo") {
  updateUpload(index, { status: "compressing" });

  if (isHeic(file)) {
    try {
      fileToUpload = await convertHeicToJpeg(file);
    } catch {
      updateUpload(index, {
        status: "error",
        error: "Couldn't process this HEIC image. Try converting to JPEG first.",
      });
      return;
    }
  }

  fileToUpload = await compressImage(fileToUpload as File);
  const dims = await getImageDimensions(fileToUpload as File);
  width = dims.width;
  height = dims.height;
}

// Videos: transcode MOV if needed
if (mediaType === "video") {
  if (isMov(file)) {
    updateUpload(index, { status: "compressing", progress: 0 });
    try {
      fileToUpload = await transcodeMovToMp4(file, (progress) => {
        updateUpload(index, { status: "compressing", progress });
      });
    } catch {
      updateUpload(index, {
        status: "error",
        error: "Couldn't convert this video. Try recording in MP4 format.",
      });
      return;
    }
  }

  const dims = await getVideoDimensions(fileToUpload as File);
  width = dims.width;
  height = dims.height;
  // ... thumbnail generation uses fileToUpload (now MP4)
}
```

### Upload status display

```typescript
// gallery-upload.tsx — update the "compressing" status display

{upload.status === "compressing" && (
  <span className="shrink-0 text-xs text-ink-soft">
    {upload.progress > 0
      ? `Converting... ${upload.progress}%`
      : "Processing..."}
  </span>
)}
```

### next.config.ts (if needed)

```typescript
// next.config.ts — add headers for SharedArrayBuffer

async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
      ],
    },
  ];
},
```

### Backfill script

```bash
# Identify broken items in Supabase
# Run from Supabase SQL editor:
SELECT id, file_path, media_type FROM gallery_items
WHERE (file_path LIKE '%.heic' OR file_path LIKE '%.mov');

# For each result: download, convert locally, re-upload, update file_path
```

## Sources & References

- `lib/media-utils.ts:33-46` — current `compressImage` fallback logic
- `app/components/gallery-upload.tsx:82-89` — photo compression flow
- `app/components/gallery-upload.tsx:117-138` — upload MIME type logic
- `app/components/gallery-section.tsx:107-133` — lightbox video MIME type mapping
- `app/components/gallery-grid.tsx:43-49` — image rendering in grid
- `docs/supabase-schema.sql:68-86` — storage bucket config and allowed MIME types
- Commit `eb832e4` — previous HEIC fix attempt (silent fallback)
- [heic2any npm](https://www.npmjs.com/package/heic2any) — HEIC to JPEG/PNG conversion
- [@ffmpeg/ffmpeg npm](https://www.npmjs.com/package/@ffmpeg/ffmpeg) — FFmpeg WebAssembly
