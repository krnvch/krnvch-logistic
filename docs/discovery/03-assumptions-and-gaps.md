> **Historical document** from the original tulip-farm discovery phase. The platform is now goods-agnostic (krnvchLogistic).

# Assumptions & Gaps Register

Each item is either an **assumption** (something we believe is true but haven't confirmed) or a **gap** (something we don't know at all). All must be resolved before finalizing requirements.

**Status key**: OPEN = needs stakeholder input | CONFIRMED = validated | REJECTED = wrong assumption

---

## Assumptions

| ID | Assumption | Source | Impact if Wrong | Status |
|----|-----------|--------|-----------------|--------|
| A-01 | There is ONE trailer used for all deliveries | Spec: "one truck/trailer" | Trailer config would need to be per-shipment, not global | **CONFIRMED** — one Euro reefer trailer |
| A-02 | All boxes are the same physical size | Not stated, inferred | If boxes vary, capacity math gets complex | **CONFIRMED** — 40x60x60cm, all identical |
| A-03 | Wall-level tracking is sufficient (no left/right columns needed) | Spec suggests optional columns | Simpler UI and data model | **CONFIRMED** — "wall 12 has 8 boxes of order #23" is enough. L/R and top/bottom are random, irrelevant. |
| A-04 | Vertical stacking (layers) is not needed | Spec suggests optional layers | Miss a key dimension | **CONFIRMED** — always 4 high, boxes are strong, no fragility. Fixed at 24 per wall, no per-layer tracking needed. |
| A-05 | Orders are finalized BEFORE loading begins | Inferred from workflow | Need edit/cancel flows | **CONFIRMED** — orders come in during February, finalized before loading day |
| A-06 | One person operates the app during loading | Not stated | Multi-user sync needs | **CONFIRMED** — one person controls loading. BUT 3-4 people need READ + MARK access during unloading. Real-time sync needed. |
| A-07 | Internet is available at the farm and market | Not stated | Offline-first architecture | **CONFIRMED** — reliable mobile data, no offline needed |
| A-08 | Tulip quantity per order is informational only | Spec section 5 | Simplifies order model | **CONFIRMED** — only box count matters for loading/unloading. Tulip qty is metadata. |
| A-09 | Clients arrive in unpredictable order | Not stated | LIFO optimization | **REJECTED** — pickup times ARE known approximately (e.g., "between 8-9am"). Loading uses LIFO: earliest pickups near doors. |
| A-10 | No payment/invoicing at pickup | Not stated | Pickup flow complexity | **CONFIRMED** (implicitly) — not mentioned, out of scope |
| A-11 | This is used 1-3 days per year | Spec | UX investment level | **CONFIRMED** — one-and-done per season. Create, work, clear, reuse. No history needed. |
| A-12 | User is moderately tech-savvy | Not stated | Simplicity requirements | **CONFIRMED** — comfortable with apps, iPad, iPhone |
| A-13 | Trailer loaded from back doors only | Standard trucks | Spatial model | **CONFIRMED** — back doors only, loading and unloading |
| A-14 | Boxes are loaded manually by hand | Family farm scale | Unit of placement | **CONFIRMED** — workers carry boxes in, operator directs and records |

**All 14 assumptions resolved.**

---

## Gaps

| ID | Question | Why It Matters | Needed From | Status |
|----|----------|---------------|-------------|--------|
| G-01 | Who are the users? How many people, what roles? | Defines personas, permissions | Stakeholder | **RESOLVED** — 1 operator (loading), 3-4 workers (unloading). Single shared account. |
| G-02 | What is the current workflow? | Baseline for improvement | Stakeholder | **RESOLVED** — Paper matrix on A4, hand-drawn, filled during loading, shared (fought over) during unloading. |
| G-03 | What is the trailer's physical spec? | Grid dimensions | Stakeholder | **RESOLVED** — Euro reefer, ~30 walls, 24 boxes per wall (6 wide x 4 high). |
| G-04 | What is the box physical spec? | Capacity math | Stakeholder | **RESOLVED** — 40cm W x 60cm H x 60cm D, standard, all identical, strong (stackable). |
| G-05 | How are orders currently recorded? | Import vs manual entry | Stakeholder | **RESOLVED** — Paper list. Manual entry in the app is fine for MVP. |
| G-06 | What is the packing workflow? | In-scope or not | Stakeholder | **RESOLVED** — Out of scope. Packing happens before loading. App starts at loading. |
| G-07 | How does pickup work at the market? | "Market mode" UX | Stakeholder | **RESOLVED** — Client says order number → worker checks matrix → finds walls → pulls boxes → marks done. 3-4 workers simultaneously. |
| G-08 | What devices will be used? | Screen size, interaction | Stakeholder | **RESOLVED** — iPad (primary, preferred), iPhone (must also work). Responsive. |
| G-09 | Is there reliable internet? | Online vs offline | Stakeholder | **RESOLVED** — Reliable mobile data. Online-only is fine. |
| G-10 | Do they need historical data? | Data retention | Stakeholder | **RESOLVED** — No. One-and-done. Clear and reuse. |
| G-11 | Is there a Shipment entity? | Data model | Spec gap | **RESOLVED** — A "shipment" is one loading event. Minimal entity: just a container for orders and placements. Can be implicit (single-tenant, one active session). |
| G-12 | Loading sequence planned? | LIFO feature | Stakeholder | **RESOLVED** — Yes. Earliest pickups near doors, latest at back. Planned by pickup time windows. |
| G-13 | Are boxes physically labeled? | Map usability | Stakeholder | **RESOLVED** — Yes! "Order #23, box 1 of 5" written on each box. |
| G-14 | Partial pickups? | Tracking granularity | Stakeholder | **RESOLVED** — No. Client takes all boxes. Leftovers = different flow, out of scope. |
| G-15 | Unclaimed orders at end of day? | Order lifecycle | Stakeholder | **RESOLVED** — Different flow, out of scope for MVP. |
| G-16 | Paperwork at handover? | Additional features | Stakeholder | **RESOLVED** — Not mentioned, out of scope. |
| G-17 | Other delivery days/products? | Tool scope | Stakeholder | **RESOLVED** — Essentially one event per year. Tool should be simple and clearable. |
| G-18 | Budget and timeline expectations? | Build scope | Stakeholder | **RESOLVED** — AI-assisted vibe-coding project. Product designer learning full dev lifecycle. No hard deadline, but wants production-quality working app for real use. Quality matters. |

**All 18 gaps resolved.**

---

## Resolution Process

1. ~~Stakeholder answers questions in interview~~ **DONE**
2. ~~BA updates each item's status~~ **DONE**
3. ~~SME validates domain-related assumptions~~ **DONE**
4. PM makes scope decisions based on confirmed reality — **NEXT**
5. Updated assumptions feed into requirements and MVP definition — **NEXT**
