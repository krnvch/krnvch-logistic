# How Grida Works

A plain-language guide to the platform — what it does, how the parts connect, and where to find things.

---

## 1. What is Grida?

Grida is a real-time logistics tool for a small farm delivery operation. A team loads ~720 boxes into a trailer, drives to a wholesale market, and hands out orders to buyers. The app replaces a hand-drawn paper map with a shared digital one — the operator builds the map during loading, workers view it on their phones at the market and mark orders as handed out. Everything syncs instantly across all devices.

---

## 2. Core Entities

The app has four main things, nested like Russian dolls:

```
Shipment
  └── Order (belongs to a shipment)
        └── Placement (boxes of an order placed on a specific wall)

Wall (a section of the trailer — defined by the shipment)
```

### Shipment

A delivery trip. Has a name (e.g., "Shipment to Berlin"), a set of walls (trailer sections), and a status: **active** or **completed**. One shipment at a time is the focus.

### Order

A customer's order within a shipment. Has an order number, client name, box count, and priority (normal/urgent). Status is **computed**, not stored:
- **Pending** — boxes not yet placed on any wall
- **Loaded** — all boxes placed on walls
- **Done** — operator or worker marked it as handed out

### Placement

"Put 5 boxes of Order #12 on Wall 3." Links an order to a specific wall with a box count. One order can be split across multiple walls.

### Wall

A numbered section of the trailer (Wall 1, Wall 2, ...). Each wall has a max capacity (boxes per wall). Walls are defined when creating a shipment.

---

## 3. How Data Flows

```
┌──────────┐      ┌──────────────┐      ┌──────────┐
│  Browser  │ ←──→ │   Supabase   │ ←──→ │ Postgres │
│  (React)  │      │  (Realtime)  │      │   (DB)   │
└──────────┘      └──────────────┘      └──────────┘
     │                                        │
     │  TanStack Query                        │  RLS policies
     │  (cache + optimistic updates)          │  (security layer)
     │                                        │
     ▼                                        ▼
  UI renders                          Data is protected
  instantly                           by row-level rules
```

**The key idea**: when someone changes something (adds an order, places boxes, marks as done), it goes to Supabase → saved in Postgres → Realtime broadcasts the change → all other open browsers update automatically. No refresh needed.

---

## 4. User Roles

| | Operator | Worker |
|---|---|---|
| **Who** | Farm owner / manager | Market workers (3-4 people) |
| **Device** | iPad / desktop | iPhone / iPad |
| **Can see** | Everything | Everything |
| **Can create/edit** | Shipments, orders, placements | Nothing |
| **Can mark "Done"** | Yes | Yes |
| **Can undo "Done"** | Yes | Yes |

Role is stored in Supabase user metadata (`raw_user_meta_data.role`). Security is enforced at the database level (RLS policies), not in the UI — so even if someone hacks the frontend, the database won't let them do unauthorized things.

---

## 5. External Integrations

```
┌─────────────────────────────────────────────────┐
│                    Grida App                     │
│              (app.grida.space)                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Supabase ──── Database, Auth, Realtime, Edge Fn │
│  PostHog ───── Product analytics (10 events)     │
│  Vercel ────── Hosting, auto-deploy from main    │
│                                                  │
├─────────────────────────────────────────────────┤
│           Edge Functions (serverless)            │
│                                                  │
│  create-suggestion ── App → Linear issue         │
│  telegram-bot ─────── Telegram → Linear issue    │
│                                                  │
├─────────────────────────────────────────────────┤
│              External Services                   │
│                                                  │
│  Linear ────── Task management (Learning Roadmap │
│                + User Suggestions projects)       │
│  Telegram ──── Quick idea capture bot            │
│  GitHub ────── Code repo + CI (Actions)          │
│                                                  │
└─────────────────────────────────────────────────┘
```

| Service | What it does | Where configured |
|---------|-------------|-----------------|
| **Supabase** | Database, auth, realtime sync, edge functions | `src/lib/supabase.ts`, env vars |
| **PostHog** | Tracks 10 business events (login, order created, etc.) | `src/lib/analytics.ts` |
| **Linear** | Task management — all planning and progress | Linear MCP in Claude Code |
| **Telegram Bot** | Private bot to capture ideas → Linear issues | `supabase/functions/telegram-bot/` |
| **Vercel** | Hosts the app, auto-deploys on merge to main | `vercel.json` |
| **GitHub Actions** | CI: lint → test → build on every PR | `.github/workflows/ci.yml` |

---

## 6. Where to Find Things

### Code (`src/`)

| Folder | What's inside |
|--------|--------------|
| `pages/` | Route-level pages: ShipmentsPage (list), ShipmentDetailPage, ProfilePage |
| `components/` | App components: order cards, trailer map, wall cells, suggestion dialog |
| `components/ui/` | shadcn/ui primitives: Button, Dialog, Badge, Textarea, etc. |
| `hooks/` | Data hooks: `use-orders`, `use-placements`, `use-shipment`, `use-auth`, etc. |
| `lib/` | Utilities: Supabase client, i18n config, analytics, CSS helper |
| `locales/` | Translation files: `en.json` + `ru.json` (~120 keys each) |
| `types/` | Shared TypeScript types |

### Docs (`docs/`)

| File | What it covers |
|------|---------------|
| `prd.md` | Product requirements — what and why |
| `architecture.md` | Technical architecture — schema, RLS, data flow |
| `CHANGELOG.md` | Release history (semver) |
| `how-it-works.md` | This file |
| `prd-*.md` | Feature-specific PRDs |
| `impl-*.md` | Feature-specific implementation plans |
| `brand/` | Brand book, visual identity, logo assets, decision logs |

### Config (root)

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Instructions for AI assistants (conventions, rules, workflow) |
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Build config (code splitting, Tailwind plugin) |
| `tsconfig*.json` | TypeScript config (strict mode) |
| `.github/workflows/ci.yml` | CI pipeline |
| `supabase/` | Edge Functions + migrations |

---

## 7. Development Workflow

```
Idea → Linear issue → feature branch → code → PR → CI (lint+test+build) → merge → auto-deploy
```

1. Every task lives in **Linear** (not in TODO files or chat)
2. Create a `feature/task-name` branch from `main`
3. Code the feature, update `docs/CHANGELOG.md` in the same commit
4. Push, create PR — CI runs automatically
5. All checks green → merge → Vercel auto-deploys to `app.grida.space`

Key rule: **changelog is mandatory** — every feature, fix, or behavioral change must update `docs/CHANGELOG.md` in the same commit as the code.
