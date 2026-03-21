# Code Review Findings

## P1 — Bugs That Will Affect Guests

### 1. Gallery "Load More" shows hidden items to guests

`app/components/gallery-section.tsx:197-201`

The `handleLoadMore` function queries without filtering hidden items:

```ts
const { data, error } = await supabase
  .from("gallery_items")
  .select("*")
  .order("created_at", { ascending: false })
  .range(items.length, items.length + PAGE_SIZE - 1);
```

The server-side fetch in `page.tsx:89` correctly adds `.eq("hidden", false)` for guests, but the client-side pagination doesn't. Guests will see hidden gallery items when they click "Περισσότερα".

### 3. XSS via innerHTML in upload modal

`app/components/upload-confirmation-modal.tsx:280-284`

The HEIC fallback `onError` handler injects `item.file.name` directly into `innerHTML`:

```ts
fallback.innerHTML = `...${item.file.name}...`;
```

A file named `<img src=x onerror=alert(1)>.heic` would execute JS. Low risk since users pick their own files, but still worth fixing with `textContent`.

---

## P2 — Functional Issues

### 4. Countdown timer hydration mismatch

`app/components/countdown-timer.tsx:28`

`useState(() => Date.now())` runs on both server and client, producing different values. This causes a React hydration mismatch on every page load. The timer will self-correct after 1 second, but you'll see console warnings and potential visual flicker.

### 5. `incrementViewCount` has stale closure in lightbox

`app/components/gallery-section.tsx:60-77`

`incrementViewCount` depends on `items` array (line 77), and is used in the Lightbox `on.view` callback. When swiping through photos, the `items` reference rebuilds on every state update, creating a new callback each time. The Lightbox might hold a stale reference, incrementing the wrong item's view count.

### 6. Double `URL.revokeObjectURL` in upload modal

`app/components/upload-confirmation-modal.tsx:42-43,126-127`

The `useEffect` cleanup revokes object URLs, AND `handleConfirm`/`handleCancel` also revoke them. Whoever runs second gets already-revoked URLs. Won't crash but could cause broken thumbnail previews during the unmount transition.

### 7. `deadline` missing from useEffect deps

Both `app/components/wish-wall.tsx:30` and `app/components/gallery-section.tsx:95` — the interval that re-checks the deadline doesn't include `deadline` in the dependency array. If admin changes the deadline, the check won't update until remount.

---

## P3 — Suggestions

### 9. Wish submission isn't optimistic

`app/components/wish-input.tsx:75-86` — Despite the prop name `onOptimisticAdd`, it waits for the DB insert to complete before calling it. A truly optimistic approach would show the wish immediately and handle failure after.

### 10. `seenTossIdsRef` grows unbounded

`app/components/rice-celebration-section.tsx:73` — The Set of seen toss IDs grows forever. For a wedding site this is fine (bounded by event duration), but worth noting.

### 11. FFmpeg loads fresh per MOV file

`lib/media-utils.ts:125-163` — Each MOV transcode creates a new FFmpeg instance, loads WASM, and terminates. If a guest uploads 5 MOV files, that's 5 WASM loads. Consider reusing the instance across the batch.
