# Logo Decision Log

**Date**: 2026-03-15
**Participants**: Product Owner (Artem), Brand Designer (Alfredo, agent #15)
**Skill used**: svg-logo-designer

---

## Round 1 — Three Concepts

### Concept 1: "The Window"
- 8 squares in a 3x3 grid, center cell empty
- **Eliminated**: Too detailed, too many elements for a clean mark

### Concept 2: "Grid G"
- Letter G built from 5 perpendicular bars
- **Kept**: Clean, simple, reads as one letter

### Concept 3: "The Signal"
- Two corner brackets (top-left + bottom-right)
- **Kept**: Abstract, distinctive, precision feeling

**Owner feedback**: Concept 1 too messy. Keep 2 and 3. Try merging them.
Also: do NOT use a grid icon — too direct an association.

---

## Round 2 — Three Options

### Option A: Grid G (standalone)
- Pure G from bars, lockup: [G]rida

### Option B: The Signal (standalone)
- Brackets + full wordmark: [brackets] Grida

### Option C: Scoped G (merged)
- G inside brackets — viewfinder focused on the letter

**Owner feedback**: Likes A and C. Needs proportion fixes:
- A: G too large vs text, baseline misaligned
- B: Bracket lines too thin vs font weight
- C: G bars heavier than bracket bars — should be equal

---

## Round 3 — Refinements

- Option A: G scaled to cap-height, baseline aligned, gap tightened
- Option B: Bracket thickness 6→8 to match font weight
- Option C: All bars equalized to 6px (brackets were 5, G was 7)

**Owner chose: Option C (Scoped G)**

---

## Round 4 — Final Polish

- Lockup: "rida" text sized to inner G height (not full icon)
- Font weight reduced from 600 to 500
- Favicon variant: G only (no brackets) for browser tabs
- Baseline fix: `translateY(4px)` on wordmark to align with G bottom bar

**Status**: Approved

---

## Final Logo System

| Asset | File | Usage |
|-------|------|-------|
| Primary mark (light) | `final-scoped-g-icon.svg` | Headers, social, print, ≥32px |
| Primary mark (dark) | `final-scoped-g-icon-dark.svg` | Dark backgrounds |
| Favicon (light) | `final-favicon-g.svg` | Browser tab, app icon, <32px |
| Favicon (dark) | `final-favicon-g-dark.svg` | Browser tab dark mode |

### Spec

- All bars: 6px in 64×64 viewBox (equal weight brackets + G)
- Lockup wordmark: Zalando Sans Expanded, weight 500, translateY(4px) for baseline
- Light color: #00875A
- Dark color: #3ECF8E

### Archive (all rounds preserved)

| File | Content |
|------|---------|
| `presentation.html` | Round 1 — 3 initial concepts |
| `presentation-round2.html` | Round 2 — A/B/C options |
| `presentation-round3.html` | Round 3 — weight/proportion fixes |
| `presentation-round4.html` | Round 4 — final approved version |
| `concept-1-window-icon.svg` | Round 1 concept (eliminated) |
| `concept-2-gridg-icon.svg` | Round 1 concept (evolved into final) |
| `concept-3-signal-icon.svg` | Round 1 concept (merged into final) |
