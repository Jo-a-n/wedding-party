---
title: "feat: Add zeugos SVG illustration above action buttons"
type: feat
status: active
date: 2026-03-21
---

# Add zeugos SVG illustration above action buttons

Place the zeugos.svg illustration between the countdown timer and the wish/photo buttons. It's 1920x813 — wide. On desktop it shows fully, on mobile it overflows (clipped) and stays centered.

## Acceptance Criteria

- [ ] SVG copied to `public/zeugos.svg`
- [ ] Rendered between `<CountdownTimer>` and the buttons div in `app/page.tsx`
- [ ] Centered horizontally
- [ ] On mobile: overflows left/right (hidden overflow), stays centered
- [ ] On desktop: fits within the container, shows the whole illustration

## MVP

### public/zeugos.svg

Copy `/Users/pavlos/Downloads/zeugos.svg` to `public/zeugos.svg`.

### app/page.tsx

Between `<CountdownTimer>` (line 190) and the buttons div (line 192), add:

```tsx
<div className="w-full overflow-hidden">
  <img
    src="/zeugos.svg"
    alt=""
    className="mx-auto w-[180%] sm:w-full max-w-[1920px] h-auto"
  />
</div>
```

- `overflow-hidden` clips the overflow on mobile
- `w-[180%]` on mobile makes it wider than container (centered via `mx-auto`)
- `sm:w-full` on desktop shows the whole thing

## Sources

- SVG source: `/Users/pavlos/Downloads/zeugos.svg` (1920x813)
- Placement: `app/page.tsx:190-192`
