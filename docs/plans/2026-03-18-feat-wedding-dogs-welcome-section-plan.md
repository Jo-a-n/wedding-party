---
title: "feat: Add dressed-up wedding dogs with cute animations"
type: feat
status: completed
date: 2026-03-18
---

# Add Dressed-Up Wedding Dogs with Cute Animations

## Overview

Place the couple's two dogs (dressed in tuxedos) on the page with playful animations — gentle wiggling, head tilts, or rocking — as if they're excitedly welcoming guests to the wedding.

## Proposed Solution

Add the two dog photos as static assets in `public/dogs/` and create a `WeddingDogs` client component that displays them flanking the hero section or just below it. Each dog gets a subtle, looping CSS animation (wiggle/rock) with staggered timing so they feel alive and independent.

### Placement

Position the dogs **below the hero CTA buttons and above the countdown timer** — they act as a visual bridge welcoming guests into the rest of the page. On mobile, stack them side by side (smaller) or vertically.

### Animation Ideas

- **Gentle wiggle**: Alternating slight rotation (-3deg to 3deg) with a soft bounce — like a dog wagging with excitement
- **Staggered timing**: Dog 1 wiggles on a 2.5s cycle, Dog 2 on a 3s cycle — so they feel independent, not synchronized
- **Hover/tap interaction** (optional): A slightly bigger wiggle or a tiny vertical bounce on hover, as if the dog noticed you

### Layout

```
Desktop:                    Mobile:
 [Dog 1]  ❤️  [Dog 2]       [Dog 1] [Dog 2]
                              (side by side, smaller)
```

- Dogs are ~120-160px tall on desktop, ~80-100px on mobile
- A small heart or paw emoji between them on desktop
- Transparent PNG backgrounds (the provided photos already have white/transparent backgrounds)

## Acceptance Criteria

- [x] Two dog photos stored in `public/dogs/` (optimized PNGs or WebP)
- [x] New `WeddingDogs` component in `app/components/wedding-dogs.tsx`
- [x] CSS keyframe animations in `globals.css` following existing patterns (`@keyframes dog-wiggle`)
- [x] Animations respect `prefers-reduced-motion: reduce` (disabled when set)
- [x] Responsive: looks good on mobile (320px+) and desktop
- [x] Integrated into `app/page.tsx` between hero section and countdown timer
- [x] Images use `loading="eager"` since they're above the fold

## Context

- The site currently has **no local image assets** — all visuals are CSS-driven. These dogs will be the first custom images in `public/`.
- Existing animation patterns to follow: `heart-fall`, `heart-sway`, `ceremony-pulse` in `globals.css`
- The photos have clean backgrounds — crop tightly around each dog for best effect
- Greek-language site, but no text needed for this feature — purely visual

## MVP

### `app/components/wedding-dogs.tsx`

```tsx
"use client";

export function WeddingDogs() {
  return (
    <div className="flex items-end justify-center gap-4 sm:gap-8 py-6">
      <img
        src="/dogs/dog1.png"
        alt="Wedding dog in tuxedo"
        className="dog-wiggle dog-1 h-20 sm:h-32 lg:h-40 w-auto drop-shadow-lg"
        loading="eager"
      />
      <span className="text-2xl sm:text-3xl animate-pulse select-none" aria-hidden="true">
        🐾
      </span>
      <img
        src="/dogs/dog2.png"
        alt="Wedding dog in tuxedo"
        className="dog-wiggle dog-2 h-20 sm:h-32 lg:h-40 w-auto drop-shadow-lg"
        loading="eager"
      />
    </div>
  );
}
```

### CSS additions in `globals.css`

```css
@keyframes dog-wiggle {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  25% { transform: rotate(-3deg) translateY(-2px); }
  75% { transform: rotate(3deg) translateY(-2px); }
}

.dog-wiggle {
  animation: dog-wiggle 2.5s ease-in-out infinite;
}

.dog-2 {
  animation-duration: 3s;
  animation-delay: 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .dog-wiggle {
    animation: none;
  }
}
```

### Integration in `app/page.tsx`

Place `<WeddingDogs />` between the hero buttons and the `<CountdownTimer />`.
