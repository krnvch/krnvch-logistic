# Login Page Animation — Decision Context

**Date**: 2026-03-15
**Status**: 3 concepts ready for final comparison
**TODO task**: 10.10 in `docs/TODO.md`
**Branch**: not started yet (still on `feature/visual-redesign`)

---

## What we're doing

Adding an animated background to the login page (`src/components/login-form.tsx`) — a visual accent that makes the first screen memorable while staying on-brand with Grida's identity.

## Team agents consulted

- **Alfredo (Brand Designer)** — brand constraints (squares only, emerald palette, "system" feel)
- **Product Designer** — UX rules (animation = background only, card stays static, respect reduced-motion)
- **Interaction Designer** — proposed 3 original concepts, motion principles
- **Frontend Engineer (UI)** — technical feasibility assessment

## Three concepts created

### Concept A — Living Grid (`01-living-grid.html`) ✅ approved as-is
- Thin grid lines (emerald, 5-8% opacity) covering the background
- Small squares at intersections pulse randomly (fade in/out)
- Feels like "the grid sees everything" — monitoring system
- Pure CSS + minimal JS for node generation
- Graceful degradation: static grid with reduced-motion

### Concept B — ASCII Animation (`02-ascii-rain.html`) ✅ approved as-is
- Background filled with monospace characters (`[ ] | — + · /`)
- Scan lines (horizontal/vertical) sweep across, brightening characters
- Random clusters also light up
- Terminal/matrix/data feel
- Canvas-based

### Concept C — Cursor Stick Field (`03-flow-field.html`) ✅ approved after 2 iterations
- Entire background filled with a grid of small line segments (sticks)
- Every stick rotates to point toward the cursor (ALL of them, not just nearby)
- When cursor leaves — sticks smoothly return to vertical

**Final tuning (iteration 2):**
- GAP: 48px (spacious, not noisy)
- Stick length: 8px half-length, 3px thick (short & chunky, not scratchy)
- Color: `rgba(30, 45, 38, 0.10)` — barely visible, whisper-light
- No endpoint dots (cleaner)
- Lerp speed: 0.12 (fast enough that distant sticks still track cursor)
- User feedback that led here: "too bold, too vivid, too noisy/busy" → made it much lighter and sparser

## Brand rules for the animation (from agent discussion)

1. **Squares and straight lines only** — radius 0, no circles/blobs/waves
2. **Colors from palette only** — primary emerald at low opacity + neutrals
3. **Must feel like a mechanism**, not decoration — "system works", not "pretty things float"
4. **"The grid sees everything"** — literal grid should be visible
5. **`prefers-reduced-motion`** — mandatory, show static version
6. **Background only** — card stays clean and static, animation behind it

## Next steps

1. Owner picks a favorite concept (or a hybrid)
2. Implement chosen animation as a React component
3. Integrate into `login-form.tsx` (behind the card)
4. Test dark mode compatibility
5. Test `prefers-reduced-motion`
6. Test mobile performance
7. Update brand docs (visual-identity.md, brand-journey.md) per governance rules

## Files

| File | What |
|------|------|
| `01-living-grid.html` | Concept A preview |
| `02-ascii-rain.html` | Concept B preview |
| `03-flow-field.html` | Concept C preview (final version) |
| `CONTEXT.md` | This file — decision context |
