# Spec Analysis — Multi-Agent Review

**Source**: `tulip-truck-load-map-spec.md` (ChatGPT initial discovery)
**Date**: 2026-02-21
**Status**: Initial analysis, pending stakeholder interview

---

## Executive Summary

**Tulip Truck Load Map** is a spatial loading planner for a small family tulip farm. The core problem: on one chaotic delivery day (~March 1), the team needs to load ~30-50 orders (hundreds of boxes) into a single truck/trailer and deliver them to a wholesale market where clients come to pick up. The app is a "spatial memory" — a digital map of what's where inside the trailer.

The idea is clear, the problem is real, the scope is small enough for a fast MVP. The spec has solid bones but several critical gaps that need stakeholder input before we can design or build anything.

---

## Agent-by-Agent Analysis

---

### SME — Logistics & Warehousing

#### What's Right

- The core problem is real and universal. Anyone who's loaded a delivery truck for multiple clients knows the chaos of "where did we put order X?"
- The "airplane seat map" metaphor is excellent — it's immediately intuitive
- Box-level tracking (not tulip-level) for loading is correct — during physical loading, you handle boxes, not individual tulips
- The constraint that orders can span multiple rows reflects real loading behavior

#### What's Concerning

1. **Loading sequence vs. unloading sequence** — the spec doesn't address this, but it's the #1 operational issue. If Client A arrives first at the market, their boxes need to be near the trailer doors (last loaded). The app should help plan loading ORDER based on expected pickup ORDER. This is classic LIFO (Last In, First Out) logistics.
2. **"One day" is misleading** — the real workflow likely spans 2-3 days:
  - Day -2/-1: Orders are confirmed, boxes are packed
  - Day 0 (loading day): Boxes go into the trailer, likely over several hours
  - Day 0 (delivery): Arrive at market, clients pick up throughout the day
  - The app needs to support all three phases, not just "loading"
3. **Physical trailer reality** — the spec says "rows" but a real trailer is a 3D space:
  - Depth: front-to-back (rows)
  - Width: left-to-right (usually 2-3 boxes wide)
  - Height: boxes stack (usually 2-4 layers high depending on weight/fragility)
  - Tulip boxes are relatively light but FRAGILE — stacking matters
  - Temperature: tulips in March might need cold chain considerations
4. **Picking at market** — the spec mentions "mark picked up" but doesn't describe the market-side workflow:
  - Client arrives → operator looks up order → finds location → pulls boxes → marks picked up
  - This needs to be FAST — the operator might be serving multiple clients
  - Mobile-first for this phase (walking around the truck with a phone)
5. **Box labeling** — if boxes aren't physically labeled with order numbers, the digital map is useless. The app might need to generate/print labels.
6. **Partial pickups** — can a client take 4 of their 6 boxes and come back for 2 later? This changes the state model.

#### Risk Flag

> The spec is building a "loading planner" but the real value might be an "unloading assistant." These are different UX flows. We need to understand which moment is most painful.

---

### Senior Business Analyst

#### Spec Quality Assessment


| Aspect                      | Score   | Notes                                                    |
| --------------------------- | ------- | -------------------------------------------------------- |
| Problem definition          | Strong  | Clear, specific, grounded in reality                     |
| Domain model                | Good    | Order + Placement entities are correct, needs refinement |
| User stories                | Weak    | No explicit user personas or stories defined             |
| Acceptance criteria         | Good    | Section 7 is testable, but incomplete                    |
| Edge cases                  | Weak    | Many unaddressed (see gaps below)                        |
| Non-functional requirements | Missing | No mention of performance, offline, mobile, multi-user   |
| Current workflow            | Missing | We don't know how they do it today                       |


#### What's Well-Defined

- Order entity with clear fields
- Placement entity with row/column/layer model
- Constraint rules (box count validation, capacity validation)
- Order lifecycle (create → place → track → pickup)
- MVP acceptance criteria (Section 7 is a solid starting point)

#### Critical Gaps Identified

**G-01: User Personas** — Who exactly uses this app?

- The farm owner?
- A farm worker doing loading?
- A driver at the market?
- All of the above? Are they different people?

**G-02: Current Workflow** — How do they solve this today?

- Paper notes? Memory? Shouting?
- What specific mistakes happen? (wrong boxes, lost orders, time wasted searching)
- How long does loading take? How long should it take?

**G-03: Trailer Specification** — Physical dimensions matter

- How many rows fit in their specific trailer?
- How many boxes per row (width)?
- How high can they stack?
- Is it always the same trailer?

**G-04: Order Source** — Where do orders come from?

- Manual entry? Spreadsheet? Phone calls?
- Are orders finalized before loading, or can they change mid-loading?
- Are there cancellations or last-minute additions?

**G-05: Multi-Device / Multi-User** — During loading:

- Is one person at the phone/tablet while others load boxes?
- Or does the person loading also operate the app?
- Gloves? Dirty hands? Screen usability?

**G-06: Offline Capability** — Is there reliable internet:

- At the farm during loading?
- At the wholesale market?
- During transport?

**G-07: Shipment Entity** — The spec mentions `shipment_id` but never defines the Shipment entity

- Is each delivery day a "shipment"?
- Can there be multiple shipments?
- Historical data — do they want to compare year-over-year?

**G-08: Pickup Scheduling** — Do clients have assigned time slots?

- If yes, loading order should match reverse pickup order
- If no, the operator needs fast search/lookup by client name

#### Data Model Observations

- The `placements` table looks correct but needs a unique constraint on `(shipment_id, row_index, column_start)` to prevent double-booking
- `column_start` / `column_end` being optional suggests rows-only mode is the default — good for MVP simplicity
- `layer` being optional is correct — most users won't need vertical tracking
- Missing: `shipments` table definition
- Missing: Who modified what and when (audit trail useful for a chaotic day)

---

### Principal Product Manager

#### Business Case

This is a **micro-SaaS / personal tool** with a clear pain point:

- One farm, one truck, one day — but absolute chaos without a system
- The ROI is immediate: avoid wrong deliveries, save loading time, reduce stress
- Potential expansion: other farms, other seasonal products, any box-based truck loading

#### What the Spec Gets Right

- The "airplane seat map" metaphor — this is the product insight. Don't lose it.
- MVP scope is tight — create orders, place boxes, track pickup. That's enough.
- Box-level tracking is the right abstraction for loading.

#### Strategic Concerns

**S-01: Over-specification risk**
The spec already defines a data model and UI in detail. For a tool used 1-3 days/year by 1-3 people, we should optimize for SPEED OF BUILDING and SIMPLICITY OF USE, not flexibility. Some spec'd features (columns, layers, placement status states) may be premature.

**S-02: The "loading" vs "unloading" question**
The spec focuses on loading (placing boxes into the trailer). But the highest-value moment might be UNLOADING at the market (finding boxes quickly when a client arrives). These need different UX:

- Loading: sequential, row-by-row, can be slow and careful
- Unloading/pickup: reactive, search-driven, must be fast under pressure

**S-03: Scope for MVP — less is more**
My instinct for MVP:

1. Define trailer as a numbered row grid (no columns, no layers for v1)
2. Create orders (number, client, boxes count)
3. Assign boxes to rows via the map
4. Color-coded visual map
5. Quick search/filter by order or client
6. Mark order as picked up

That's it. Columns, layers, partial pickups, placement history — all v2.

**S-04: One-day-a-year product**
This is used intensively for 1-3 days per year. Implications:

- Must be instantly understandable — no training, no learning curve
- Data entry must be as fast as possible (batch import from spreadsheet?)
- Consider: is a web app the right form factor, or would a spreadsheet with a visualization layer be simpler?

#### Business Solution Framing


| Without the app                        | With the app                                   |
| -------------------------------------- | ---------------------------------------------- |
| Loading by memory and shouting         | Visual map shows exactly where everything goes |
| Searching through boxes at the market  | One tap to find any order's location           |
| Mistakes: wrong boxes given to clients | Validated placements, tracked pickups          |
| No record for next year                | Saved layouts to learn from                    |


#### Success Metrics (Proposed)

- Loading time reduction (measure: time from first box to trailer departure)
- Zero delivery errors (measure: orders given to wrong client)
- Pickup speed (measure: time from client arrival to box handover)
- User satisfaction (measure: "would you use this again next year?")

---

### Principal Product Designer

#### Initial UX Observations

1. **The map is the product** — the trailer visualization must be the centerpiece, always visible, always showing current state. Everything else (orders, details) is secondary.
2. **Two modes needed**:
  - **Loading mode**: Building the map. Sequential, deliberate. Desktop/tablet friendly.
  - **Market mode**: Using the map. Reactive, search-driven. Must work on phone with one hand.
3. **Color system is critical** — with 30-50 orders, you need a color palette that:
  - Has enough distinct colors (or uses a pattern system)
  - Works for color-blind users
  - Remains readable at small sizes on mobile
4. **The spec's "airplane seat" metaphor** is perfect but needs adaptation:
  - Airplane: fixed seats, one person per seat
  - Trailer: variable box count per row, one order can span many rows
  - The visual should feel more like a "stacked bar chart turned sideways" than a seat grid
5. **Potential shadcn/ui components for MVP**:
  - Card (order cards)
  - Badge (status, box counts)
  - Dialog/Sheet (placement details)
  - Command (quick search)
  - Progress (placement completeness)
  - Custom SVG/Canvas for the trailer map itself

---

### Principal Interaction Designer

#### Key Interaction Concerns

1. **Drag-and-drop vs. click-to-assign** — the spec implies click-based ("select order, select row, enter count"). For MVP this is simpler and works on mobile. Drag-and-drop is v2.
2. **The placement flow needs to be 3 taps or fewer**:
  - Tap order → Tap row → Confirm count → Done
  - Any more friction and they'll abandon the app for memory
3. **Market-side interaction** — finding an order under pressure:
  - Must have a prominent search bar
  - Type client name → see their rows highlighted on the map instantly
  - One-tap "mark picked up" with confirmation
4. **Undo is critical** — loading is messy, mistakes happen. Every action must be reversible.

---

## Overall Assessment


| Dimension             | Rating     | Summary                                                   |
| --------------------- | ---------- | --------------------------------------------------------- |
| Problem clarity       | High       | Real problem, clearly articulated                         |
| Domain understanding  | Medium     | Good start, needs SME validation on physical constraints  |
| User understanding    | Low        | No personas, no current workflow documented               |
| Technical feasibility | High       | Simple CRUD + visualization, well within Supabase + React |
| Scope risk            | Medium     | Spec leans toward over-engineering for a v1               |
| UX definition         | Low-Medium | Good concepts but no detailed flows yet                   |


**Verdict**: Solid foundation. We need one focused stakeholder interview to fill the gaps, then we can define flows and requirements. The biggest risk is building too much — this needs to be dead simple.

---

## Next Steps

1. **Stakeholder interview** — see `01-interview-questions.md`
2. Fill gaps documented in `03-assumptions-and-gaps.md`
3. Then: define main flows, FR/NFR, and MVP scope

