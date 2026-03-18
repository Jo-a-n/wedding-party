---
title: "feat: Add wedding countdown timer with three states"
type: feat
status: active
date: 2026-03-18
---

# Wedding Countdown Timer

A live countdown timer that transitions through three states based on the wedding ceremony timeline.

## Key Dates (Athens, Greece — UTC+02:00)

- **Ceremony start:** `2026-03-21T19:30:00+02:00` (Saturday)
- **Ceremony end:** `2026-03-21T20:00:00+02:00` (30 min later)

## Three States

### 1. Before ceremony (countdown)

Display a live countdown: **X days, Y hours, Z minutes, S seconds** until 19:30.

Greek copy example: `Σε X ημέρες, Y ώρες, Z λεπτά, S δευτερόλεπτα`

### 2. During ceremony (19:30 – 20:00)

Show a funny "in progress" message. Examples:

- `Γάμος σε εξέλιξη... 💍`
- `Παντρεύονται αυτή τη στιγμή!`
- A playful animation or pulsing indicator

### 3. After ceremony (counting up)

Show elapsed time since 20:00: **Παντρεμένοι εδώ και: HH:MM:SS**

Counting up from the ceremony end time.

## Acceptance Criteria

- [ ] Countdown updates every second with no drift (use `Date.now()` on each tick, not cumulative addition)
- [ ] Smooth transition between all three states without page reload
- [ ] Greek copy for all text
- [ ] Respects `prefers-reduced-motion` (can show static text instead of ticking)
- [ ] Works in both light and dark mode
- [ ] Mobile responsive
- [ ] Interval cleanup on unmount (`useEffect` return)

## Implementation

### `app/components/countdown-timer.tsx`

- `"use client"` component
- Two constants: `CEREMONY_START` and `CEREMONY_END` as `Date` objects with `+02:00` offset
- `useState` for current time diff, `useEffect` with `setInterval(1000)` to tick
- Derive state from comparing `Date.now()` against the two timestamps
- Export `CountdownTimer` (no props needed — dates are hardcoded)

### `app/page.tsx`

- Import and place `<CountdownTimer />` between the hero `</section>` (line ~133) and `<RiceCelebrationSection>` (line ~135)
- No server-side data needed — pure client component

### `app/globals.css`

- Optional: add a subtle pulse animation for the "in progress" state
- Use existing design tokens (`text-foreground`, `text-ink-soft`, `bg-surface`, pastel accents)

### Styling approach

- Use a `pastel-panel` or `soft-card` wrapper to match existing sections
- Large, readable countdown digits
- Smaller label text beneath each unit (ημέρες, ώρες, λεπτά, δευτερόλεπτα)
- For "married for" state, a warm celebratory feel (maybe `text-blush` or `text-apricot` accent)

## Pattern Reference

- `app/components/wish-wall.tsx:9-27` — deadline constant + interval pattern
- `app/components/rice-celebration-section.tsx` — complex client component example
- `app/globals.css` — animation keyframes, design tokens, `prefers-reduced-motion`

## Sources

- TODO.md line 12: `- [ ] timer. time to marriage. time since married.`
