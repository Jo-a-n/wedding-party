---
title: Guest Wish Wall
type: feat
status: active
date: 2026-03-17
---

# Guest Wish Wall

## Overview

A section at the bottom of the homepage where wedding guests can leave a short wish/message for the couple along with their name. Wishes display as cards in real-time. The input form is available from the wedding day (March 21, 2026 at 11:00 EEST) for 24 hours, then the wall becomes read-only.

## Problem Statement / Motivation

The couple wants a digital guestbook where friends and family can leave wishes around the wedding day. It should feel easy and personal — no accounts, no friction, just type and send.

## Key Decisions

- **Database:** Supabase (Postgres + Realtime + Storage for future photo uploads)
- **Input UX:** Inline card at the top of the wishes section (looks like a blank wish card)
- **Real-time:** Yes — new wishes animate in live via Supabase Realtime subscriptions
- **Draft persistence:** localStorage to survive refreshes
- **Time-gated:** Input available for 24 hours starting March 21, 2026 11:00 EEST. After that, read-only.

## Proposed Solution

### Architecture

```
Server Component (page.tsx)
  └─ Fetches initial wishes from Supabase
  └─ Renders <WishWall initialWishes={wishes} />

Client Component (WishWall)
  ├─ Subscribes to Supabase Realtime (INSERT events on `wishes` table)
  ├─ Manages wish list state (initial + realtime additions)
  ├─ Checks current time vs deadline to show/hide input
  ├─ <WishInput /> — inline card form, draft saved to localStorage
  └─ <WishCard /> — individual wish display
```

### Database Schema

```sql
-- Run in Supabase SQL Editor
create table public.wishes (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 100),
  message    text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index wishes_created_at_desc on public.wishes (created_at desc);

-- RLS: public read, public insert, no update/delete
alter table public.wishes enable row level security;

create policy "Anyone can read wishes"
  on public.wishes for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert wishes"
  on public.wishes for insert
  to anon, authenticated
  with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.wishes;
```

**Note:** No `photo_url` column yet. When photo uploads are added later, a separate `wish_photos` join table or a nullable column can be migrated in. Keep it simple for now.

### File Structure

```
lib/
  supabase/
    client.ts          # createBrowserClient (singleton, for "use client" components)
    server.ts          # createServerClient (for server components)
app/
  components/
    wish-wall.tsx      # Main section: list + realtime + time-gate logic
    wish-input.tsx     # Inline card form with localStorage draft
    wish-card.tsx      # Individual wish card display
  page.tsx             # Updated: fetches wishes, renders <WishWall />
.env.local             # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Supabase Client Setup

**`lib/supabase/client.ts`** — browser singleton:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`lib/supabase/server.ts`** — server component client:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );
}
```

### Component Details

#### WishWall (`wish-wall.tsx`)

- Client component
- Receives `initialWishes` from server component props
- Sets up Supabase Realtime subscription for INSERT events
- Deduplicates optimistic inserts against realtime events using `id`
- **Time gate:** Compares `Date.now()` against deadline (`2026-03-22T11:00:00+03:00`). If past deadline, hides `<WishInput />` and shows a "The wish wall is now closed" message.
- Renders wish cards in reverse chronological order (newest first)
- Empty state: "Be the first to leave a wish for the couple!" with a heart icon

#### WishInput (`wish-input.tsx`)

- Inline card styled like a blank wish card (uses existing `.soft-card` tokens)
- Two fields: name (single line), message (textarea)
- Draft persisted to `localStorage` under key `wedding-party-wish-draft`
- Draft loaded on mount via `useEffect` (avoids hydration mismatch)
- On submit:
  1. Client-side validation (name 1-100 chars, message 1-500 chars, trimmed)
  2. Insert via Supabase client directly (anon key + RLS)
  3. Optimistic update: immediately add to wish list
  4. Clear draft from localStorage
  5. Disable button during submission, show loading state
  6. On error: show inline error, keep draft
- Double-submit prevention: disable button on click, re-enable on error

#### WishCard (`wish-card.tsx`)

- Displays name, message, and relative timestamp
- Uses pastel accent colors — each card gets a color from the existing palette based on index or id (mint, periwinkle, blush, apricot, pistachio — cycling)
- Entrance animation: subtle fade-in + slide-up (respects `prefers-reduced-motion`)
- Dark mode support via existing CSS variables

### Page Integration

The wish wall section goes **after the rice celebration section**, replacing the color palette and system info sections (which are design scaffolding). Section structure:

```
Header (with theme toggle)
Hero section
Rice Celebration
Wish Wall  ← NEW
```

The palette and system info sections can be removed or kept below for development — they're not user-facing content.

### Time Gate Logic

```ts
const WISH_DEADLINE = new Date("2026-03-22T11:00:00+03:00"); // 24h after wedding

function isWishingOpen(): boolean {
  return Date.now() < WISH_DEADLINE.getTime();
}
```

After the deadline, the `<WishInput />` component is not rendered. The wish cards remain visible permanently.

### Dependencies to Install

```bash
yarn add @supabase/supabase-js @supabase/ssr
```

## Technical Considerations

- **Hydration:** localStorage reads must happen in `useEffect`, not during render. The draft hook uses a `hydrated` flag to prevent premature persistence.
- **Realtime deduplication:** When a user submits, the wish is added optimistically. The same wish arrives via Realtime. Deduplicate by checking if the `id` already exists in the list.
- **Supabase free tier:** 200 concurrent Realtime connections. For ~200 wedding guests, peak concurrent viewers will likely be 20-50. Well within limits.
- **Free tier pausing:** Supabase free projects pause after 7 days of inactivity. The wedding is this Saturday — ensure the project is active. Consider a simple uptime ping if setting up earlier than 7 days before.
- **No middleware needed:** Since there's no auth, the Supabase middleware for cookie/session management is unnecessary. The browser client can be used directly.
- **Security:** The anon key is public but RLS ensures: anyone can SELECT, anyone can INSERT, nobody can UPDATE or DELETE. DB-level CHECK constraints enforce field lengths.

## Acceptance Criteria

- [ ] Supabase project created with `wishes` table, RLS policies, and Realtime enabled
- [x] `lib/supabase/client.ts` and `lib/supabase/server.ts` created
- [x] `.env.local` with Supabase URL and anon key (gitignored)
- [x] `<WishWall>` component displays existing wishes as styled cards
- [x] `<WishInput>` inline card form at top of section for adding wishes
- [x] Draft (name + message) persists in localStorage, survives refresh
- [x] Successful submission clears draft and optimistically shows the new wish
- [x] New wishes from other guests appear in real-time without refresh
- [x] Input form hidden after March 22, 2026 11:00 EEST (24h post-wedding)
- [x] After deadline, wish wall shows existing wishes with a "closed" note
- [x] Wish cards cycle through pastel accent colors
- [x] Entrance animation for new wishes (fade-in + slide-up)
- [x] Mobile-friendly: single-column layout, proper touch handling
- [x] Dark mode works correctly with existing theme toggle
- [x] Accessible: proper labels, focus management, `aria-live` for new wishes
- [x] Client-side validation: name 1-100 chars, message 1-500 chars
- [x] Double-submit prevention on the form
- [x] Empty state with encouraging message when no wishes exist

## Success Metrics

- Guests can leave wishes without confusion or errors
- Wishes appear in real-time for everyone on the page
- The feature works smoothly on mobile (most guests will use phones)
- Draft persistence prevents frustration from accidental refreshes

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Supabase free tier project pauses | Keep it active this week; wedding is Saturday |
| Spam/abuse on public form | DB CHECK constraints limit field sizes; rate limiting can be added if needed; RLS prevents edits/deletes; only open for 24 hours |
| Realtime connection drops | Supabase client auto-reconnects; missed wishes appear on next page load |
| Mobile keyboard covers submit button | Test on mobile; ensure form scrolls properly |

## Sources & References

- [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — client setup patterns
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — subscription API
- [Supabase Pricing](https://supabase.com/pricing) — free tier limits (200 concurrent Realtime connections, 500MB DB)
- Existing patterns: `app/components/rice-celebration-section.tsx` — localStorage usage with `useSyncExternalStore`
- Design tokens: `app/globals.css` — `.soft-card`, pastel colors, dark mode variables
