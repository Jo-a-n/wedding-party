---
title: "feat: Add heart SVG behind NameShip button"
type: feat
status: active
date: 2026-03-21
---

# Add heart SVG behind NameShip button

Add the decorative heart SVG shape behind the NameShip button in the dogs section, matching the Figma design (node 1-408). The button text overlays the heart with no background — just text on top of the SVG shape.

## Acceptance Criteria

- [ ] Heart SVG (`HEART.svg`) is copied to `public/heart.svg`
- [ ] Heart SVG is rendered behind the NameShip button text in the dogs section
- [ ] NameShip button is restyled: text-only, no background, no `soft-chip` class, no border/shadow — just the name text + 💕 emojis sitting on top of the heart
- [ ] Heart + button are layered using relative/absolute positioning so the text is centered on the heart
- [ ] Responsive sizing works across mobile/tablet/desktop
- [ ] Clicking the heart/text area still cycles the name

## Context

**Current state:** The NameShip button uses `.soft-chip` styling (frosted glass background, rounded pill, shadow). It sits between the two dogs in a flex column.

**Target state (from Figma):** A purple/pink gradient heart SVG sits behind the text. The button itself has no visible background — the heart IS the visual container. The 💕 emojis appear above and below the name text, all centered on the heart.

## MVP

### public/heart.svg

Copy `/Users/pavlos/Downloads/HEART.svg` to `public/heart.svg`.

### app/components/wedding-dogs.tsx

Wrap the `<NameShip />` in a container that positions the heart SVG behind it:

```tsx
<div className="flex flex-col items-center gap-2 self-center relative">
  <img
    src="/heart.svg"
    alt=""
    className="w-[152px] sm:w-[200px] lg:w-[240px] h-auto"
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <NameShip />
  </div>
</div>
```

### app/components/name-ship.tsx

Strip the button styling — remove `soft-chip`, background, shadow, border. Keep it as a clickable text element:

```tsx
<button
  type="button"
  onClick={cycle}
  className="inline-flex flex-col items-center cursor-pointer text-[14px] text-jneutral transition-transform duration-150 hover:scale-105 active:scale-95"
>
  <span>💕</span>
  <span>{NAME_SHIPS[index]}</span>
  <span>💕</span>
</button>
```

Key changes:
- Remove `soft-chip rounded-full px-4 py-2 shadow-sm`
- Change `text-ink-soft` to `text-jneutral` (light cream text on purple heart)
- Use `text-[14px]` for size

## Sources

- Figma design: node 1-408 in kokoniela.party file
- SVG source: `/Users/pavlos/Downloads/HEART.svg`
- Current implementation: `app/components/wedding-dogs.tsx`, `app/components/name-ship.tsx`
