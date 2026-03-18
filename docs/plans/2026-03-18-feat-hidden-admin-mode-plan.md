---
title: Hidden Admin Mode
type: feat
status: active
date: 2026-03-18
---

# Hidden Admin Mode

A hidden admin mode activated via secret URL parameter that adds inline edit/delete controls to the existing page — for quick fixes on the wedding day.

## How It Works

- `site.com` → normal guest experience
- `site.com/?admin=banana` → same page with admin controls visible

No cookies, no login, no toggle. The server checks the `?admin=banana` query param on page load and passes `isAdmin={true}` down to client components. Admin API routes verify the password via an `X-Admin` header sent with each request.

## Acceptance Criteria

- [ ] Password `"banana"` checked server-side only (param value not leaked to client JS)
- [ ] **Wishes**: delete button (×) on each wish card
- [ ] **Gallery**: delete button on each gallery tile (removes DB row + storage file + thumbnail)
- [ ] **Deadlines**: inline editable wish/gallery close times (currently hardcoded in `wish-input.tsx` and `gallery-upload.tsx`)
- [ ] **Rice counter**: reset button to zero out rice tosses
- [ ] All admin actions go through Next.js API routes using the Supabase **service role key** (bypasses RLS, no new DB policies needed)
- [ ] API routes verify `X-Admin: banana` header before executing
- [ ] Admin controls are visually distinct (e.g., red/muted) but not jarring
- [ ] Confirmation dialog before destructive actions (delete, reset)
- [ ] Works on mobile (admin will likely be on phone on the day)

## Context

- **No auth exists today** — this is the first auth-like mechanism
- **Service role key** already exists in env but isn't used in the app code
- Using service role key server-side means **zero Supabase schema changes** for existing tables — it bypasses RLS entirely
- Deadlines are currently hardcoded as constants; a `site_settings` table stores overrides
- Password is hardcoded — this is a wedding site, not a bank

## MVP

### Architecture

```
site.com/?admin=banana → app/page.tsx (server component)
                           ├── checks searchParams.admin === "banana"
                           ├── passes isAdmin={true} to client components
                           └── client components conditionally render admin controls
                                 └── admin actions → /api/admin/* routes
                                       ├── verify X-Admin header
                                       └── use service role Supabase client
```

### Admin Check — `app/page.tsx`

```typescript
// In the server component:
const searchParams = await props.searchParams;
const isAdmin = searchParams?.admin === "banana";

// Pass isAdmin to all sections
<WishWall wishes={wishes} isAdmin={isAdmin} />
<GallerySection items={galleryItems} isAdmin={isAdmin} />
<RiceCelebrationSection count={riceCount} isAdmin={isAdmin} />
```

### Admin API Helper — `lib/admin.ts`

```typescript
const ADMIN_PASSWORD = "banana";

// Server-side: verify admin header in API routes
export function verifyAdmin(request: Request): boolean {
  return request.headers.get("X-Admin") === ADMIN_PASSWORD;
}

// Client-side: helper to make admin API calls
export function adminFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Admin": "banana",
    },
  });
}
```

Note: the password appears in client JS only when `isAdmin` is true (the `adminFetch` helper is only used by admin-mode components). Since guests never load with `?admin=banana`, they never see this code path. For a wedding site, this is fine.

### API Routes

#### `app/api/admin/wishes/[id]/route.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("wishes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

#### `app/api/admin/gallery/[id]/route.ts`

```typescript
// Same pattern — also deletes from storage bucket:
// 1. Fetch gallery_item to get file_path and thumb_path
// 2. Delete from storage: supabase.storage.from("gallery").remove([file_path, thumb_path])
// 3. Delete DB row
```

#### `app/api/admin/rice/route.ts`

```typescript
// DELETE handler — truncates rice_tosses table
// Uses service role: supabase.from("rice_tosses").delete().neq("id", 0)
```

#### `app/api/admin/settings/route.ts`

```typescript
// GET: returns current deadline overrides
// PUT: updates deadlines in site_settings table
```

### Inline Controls — Example: `wish-card.tsx`

```tsx
export function WishCard({ wish, isAdmin }: { wish: Wish; isAdmin?: boolean }) {
  const handleDelete = async () => {
    if (!confirm("Delete this wish?")) return;
    await adminFetch(`/api/admin/wishes/${wish.id}`, { method: "DELETE" });
    // Realtime subscription will handle UI update automatically
  };

  return (
    <div className="soft-card relative group">
      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-60 hover:opacity-100"
          title="Delete wish"
        >
          ×
        </button>
      )}
      {/* ... existing card content ... */}
    </div>
  );
}
```

### Deadline Management

```tsx
// When isAdmin is true, show editable datetime inputs near the
// "Wishes are now closed" / upload deadline areas.
// On save, PUT to /api/admin/settings with new deadline.
// Components read deadline from props (server-fetched from site_settings)
// instead of hardcoded constants.
```

### New Supabase Table (for deadline overrides)

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with defaults
INSERT INTO site_settings (key, value) VALUES
  ('wish_deadline', '2026-03-22T11:00:00+03:00'),
  ('gallery_deadline', '2026-03-22T11:00:00+03:00');

-- Only service role can modify (no anon RLS policy for UPDATE/DELETE)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true);
```

## Dependencies

- `SUPABASE_SERVICE_ROLE_KEY` env var (already exists, just not in app code)
- No new npm dependencies needed
