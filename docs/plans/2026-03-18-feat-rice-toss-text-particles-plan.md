---
title: "feat: Add counter number and celebration text particles to rice toss"
type: feat
status: active
date: 2026-03-18
---

# Add counter number and celebration text particles to rice toss

## Overview

Enhance the rice tossing animation to shoot text particles alongside rice grains:
1. **Counter number** — on every toss, shoot the new counter value as a small text particle
2. **Celebration text** — roughly every 25 tosses, also shoot "θα γλιστρίσουμε" as an additional text particle

## Proposed Solution

Extend the existing canvas particle system with a discriminated union on the `Particle` type. Text particles reuse the same physics pipeline but with tuned parameters (less sway, minimal spin) and render via `fillText` instead of `fillRect`.

### Key Decisions

- **Counter value**: Use optimistic `riceCount + 1` computed at burst creation time, before the DB call. The particle appears instantly with the rice — no waiting for Supabase. If the insert fails, the particle already flew; acceptable for a fun wedding feature.
- **Celebration trigger**: `Math.random() < 1/25` on each local toss. Simpler than tracking personal toss count or modulo on the global counter. The `~` in the spec suggests randomness is fine.
- **Remote users**: Only the tosser sees text particles. Remote users just see the counter number update in the display (existing behavior).

## Implementation

All changes are in a single file: `app/components/rice-celebration-section.tsx`

### 1. Extend the `Particle` type (lines 12-29)

Add a discriminated union with a `kind` field:

```typescript
// rice-celebration-section.tsx
type Particle = {
  id: number;
  x: number;
  y: number;
  initialX: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
  color: string;
  swayOffset: number;
  swaySpeed: number;
  swayAmount: number;
} & (
  | { kind: "rice"; length: number; width: number }
  | { kind: "counter" | "celebration"; text: string; fontSize: number }
);
```

### 2. Update the draw loop (lines 156-168)

Branch rendering on `particle.kind`:

```typescript
// rice-celebration-section.tsx — inside the draw loop
if (particle.kind === "rice") {
  context.fillRect(
    -particle.length / 2,
    -particle.width / 2,
    particle.length,
    particle.width,
  );
} else {
  context.font = `${particle.kind === "celebration" ? "600 " : "600 "}${particle.fontSize}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  // dark outline for readability on light backgrounds
  context.strokeStyle = "rgba(0,0,0,0.25)";
  context.lineWidth = 2;
  context.strokeText(particle.text, 0, 0);
  context.fillText(particle.text, 0, 0);
}
```

### 3. Update `createBurst` to spawn text particles (lines 215-277)

After creating rice particles and before the DB insert:

```typescript
// rice-celebration-section.tsx — inside createBurst, after newParticles array
const nextCount = riceCount + 1;

// Counter number particle — always
const counterParticle: Particle = {
  id: nextParticleIdRef.current++,
  kind: "counter",
  text: nextCount.toLocaleString("el-GR"),
  fontSize: 15,
  x: start.x,
  y: clamp(start.y, 32, height - 28),
  initialX: start.x,
  vx: Math.cos(angle) * power * 0.7,
  vy: Math.sin(angle) * power * 0.7,
  rotation: 0,
  spin: 0,
  life: 0,
  maxLife: 90,
  color: "#ffffff",
  swayOffset: 0,
  swaySpeed: 0,
  swayAmount: 0,
};

newParticles.push(counterParticle);

// Celebration text — ~1 in 25 chance
if (Math.random() < 1 / 25) {
  const celebrationParticle: Particle = {
    id: nextParticleIdRef.current++,
    kind: "celebration",
    text: "θα γλιστρίσουμε!",
    fontSize: 18,
    x: start.x,
    y: clamp(start.y, 32, height - 28),
    initialX: start.x,
    vx: Math.cos(angle) * power * 0.5,
    vy: Math.sin(angle) * power * 0.5,
    rotation: 0,
    spin: 0,
    life: 0,
    maxLife: 160,
    color: "#f5d0e3",
    swayOffset: 0,
    swaySpeed: 0,
    swayAmount: 0,
  };

  newParticles.push(celebrationParticle);
}
```

### 4. Add `kind: "rice"` to existing rice particle creation (line 235)

Add `kind: "rice"` to the return object in the `Array.from` callback that creates rice grain particles.

## Acceptance Criteria

- [ ] Every rice toss shoots a small number particle showing the new count
- [ ] The number is readable (white text with subtle outline, no wild spinning)
- [ ] ~1 in 25 tosses also shoots "θα γλιστρίσουμε!" as a larger pink text particle
- [ ] Text particles have reduced sway and spin compared to rice grains (stays readable)
- [ ] Works on both desktop (drag) and mobile (touch button)
- [ ] Counter number matches the displayed counter value
- [ ] No visual regression on the existing rice particle animation

## Context

- Only `app/components/rice-celebration-section.tsx` needs changes
- The existing `Particle` type needs the discriminated union — all rice particle creation sites must add `kind: "rice"`
- Text physics: zero sway, zero spin, lower velocity (~0.5-0.7x), shorter lifetime for counter (90 frames), longer for celebration (160 frames)
- Font: `system-ui` with `600` weight for both; celebration gets slightly larger fontSize
- The celebration text color `#f5d0e3` is already in the COLORS palette so it feels cohesive
