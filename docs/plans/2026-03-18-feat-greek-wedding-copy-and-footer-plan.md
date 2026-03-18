---
title: Greek wedding copy, names, and footer
type: feat
status: active
date: 2026-03-18
---

# Greek wedding copy, names, and footer

## Overview

Replace all developer placeholder text with romantic Greek wedding copy for Ντανιέλα & Κωνσταντίνος (wedding: Σάββατο 21 Μαρτίου 2026). Add a "made with love" footer crediting the site builders.

## What changes

### 1. Header (`app/page.tsx` lines ~86-98)

- Replace "Wedding Party" → couple's names: **Ντανιέλα & Κωνσταντίνος**
- Replace subtitle → wedding date: **21 Μαρτίου 2026**

### 2. Hero section (`app/page.tsx` lines ~100-133)

- Replace chip text with something romantic/contextual (e.g. wedding venue, theme, or a warm welcome)
- Replace H1 with a romantic Greek heading (e.g. "Καλώς ήρθατε στη γιορτή μας" or similar)
- Replace body text with a warm invitation message in Greek
- Keep the two CTA buttons but translate: "Leave a wish" → "Αφήστε μια ευχή", "Photo album" → "Φωτογραφίες"

### 3. Rice section (`app/components/rice-celebration-section.tsx`)

- Replace heading "Ryzi sta paidia!" with proper Greek and something more playful/fun
- Replace the instructional body text with something celebratory and less dry
- Add a Greek wordplay pun somewhere in this section (wedding/rice/traditions related)
- Translate any remaining English strings (button text, counter label, instructions)

### 4. Wish wall section headings

- Translate "Guest wishes" → "Ευχές"
- Translate "Wishes for the couple" → something romantic in Greek
- Translate form placeholders and labels to Greek

### 5. Gallery section headings

- Translate "Photo album" / "Shared moments" / "Share a photo or video" to Greek

### 6. Footer (new, bottom of `app/page.tsx`)

- Add a simple centered footer after the gallery section
- Text: "Φτιαγμένο με αγάπη από την Ιωάννα και τον Παύλο" (or similar)
- Styled subtly — small text, muted color, some bottom padding

### 7. Metadata (`app/layout.tsx`)

- Update `<title>` and `<meta description>` to Greek

## Out of scope (later TODOs)

- Rice counter on mobile button
- Fun extras / Greek TV gifs
- Upload confirmation step
- Removing palette section and system info cards

## Acceptance Criteria

- [ ] All visible text on the site is in Greek
- [ ] Couple's names (Ντανιέλα & Κωνσταντίνος) and date (21 Μαρτίου 2026) are prominent
- [ ] Rice section has playful/fun Greek text with a pun or wordplay
- [ ] Footer with builder credit appears at the bottom
- [ ] Page metadata is in Greek
- [ ] No English placeholder/dev copy remains in visible sections (palette and system cards excluded — kept for now)
