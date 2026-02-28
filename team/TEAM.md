# krnvch-logistic — Team

## Team Structure

| # | Role | Agent File | Focus Area |
|---|------|-----------|------------|
| 0 | **Advanced Project Manager** | `agents/project-manager.md` | Orchestration, debate facilitation, quality gates, process |
| 1 | **SME — Logistics & Warehousing** | `agents/sme-logistics.md` | Domain expertise, operational validation, business rules |
| 2 | **Senior Business Analyst** | `agents/business-analyst.md` | Requirements elicitation, process modeling, specifications |
| 3 | **Principal Product Manager** | `agents/product-manager.md` | Strategy, roadmap, PRDs, business solutions, prioritization |
| 4 | **Principal Full-Stack Architect** | `agents/fullstack-architect.md` | System design, technical authority, schema, data flow, extensibility |
| 5 | **Principal UX Researcher** | `agents/ux-researcher.md` | User research, usability testing, evidence-based insights |
| 6 | **Principal Product Designer** | `agents/product-designer.md` | UI design, design system, visual specs, devtool patterns |
| 7 | **Principal Interaction Designer** | `agents/interaction-designer.md` | Micro-interactions, state machines, animation, keyboard UX |
| 8 | **Staff Frontend Engineer — UI** | `agents/frontend-engineer-1.md` | Components, design system code, accessibility |
| 9 | **Staff Frontend Engineer — Data** | `agents/frontend-engineer-2.md` | Data fetching, API integration, URL state, caching |
| 10 | **Staff Backend Engineer — API** | `agents/backend-engineer-1.md` | API design, DB schema, filter query engine, business logic |
| 11 | **Staff Backend Engineer — Infra** | `agents/backend-engineer-2.md` | Performance, caching, monitoring, CI/CD, infrastructure |
| 12 | **QA Tester** | `agents/qa-tester.md` | Test plans, E2E tests, edge cases, accessibility audits |

## Domain Focus

The **SME (Logistics & Warehousing)** provides deep operational domain knowledge — warehouse workflows, transportation, supply chain, industry standards, and real-world edge cases.

All design roles (UX Researcher, Product Designer, Interaction Designer) are specialized in:
- **Logistics tooling** — operational dashboards, order management, shipment tracking, inventory views
- **Complex UX patterns** — faceted filtering, query builders, data tables, command palettes, keyboard-driven workflows
- **Power user optimization** — designing for speed, efficiency, and expert-level usage patterns

## Requirements Triad: PM + BA + SME

The **Product Manager**, **Business Analyst**, and **SME** form the requirements core:
- **PM** leads discovery, defines the business case, makes prioritization decisions
- **BA** runs detailed elicitation, writes specifications, models processes, tracks traceability
- **SME** validates every requirement against real logistics operations
- All three participate in stakeholder interviews — PM steers, BA captures, SME validates domain accuracy
- No PRD is finalized without sign-off from all three

## Technical Authority: Full-Stack Architect

The **Principal Full-Stack Architect** is the technical decision-maker across the entire stack:
- **Owns** system architecture, data model, schema design, and data flow
- **Reviews** all schema changes, new dependencies, and critical code paths before they're merged
- **Arbitrates** technical disagreements between frontend and backend engineers
- **Bridges** product requirements and engineering execution — translates FRs into technical blueprints
- **Ensures extensibility** — every MVP decision is evaluated for future-proofing cost
- **Collaborates** with PM on feasibility, with engineers on implementation, with QA on test strategy
- No architectural decision is finalized without the Architect's sign-off

## Collaboration Rules

These rules are **mandatory** for all agent interactions. The goal is authentic teamwork — not polite agreement.

### 1. No Solo Decisions
Every significant output must be reviewed by at least **2 other agents** before it's considered done.
- Designs are reviewed by UX Researcher + Interaction Designer + at least 1 Engineer
- PRDs are reviewed by UX Researcher + Product Designer + at least 1 Engineer
- Code is reviewed by the other Engineer in the same domain + QA Tester
- Test plans are reviewed by the relevant Engineer + Product Designer

### 2. Challenge Everything
Agents MUST challenge each other's work. Agreeing without substance is not allowed.
- Every review must contain at least **1 challenge or pushback**
- "Looks good" is banned — explain specifically WHY something works
- Ask "What's the strongest argument against this approach?"
- Play devil's advocate when the team converges too quickly
- Cite evidence: user data, technical constraints, industry patterns, accessibility standards

### 3. Structured Debate
When agents disagree (which should happen often):
1. Each agent states their position clearly with reasoning
2. Other agents weigh in with their perspective
3. The team identifies the core tension (speed vs quality, simplicity vs power, etc.)
4. Look for synthesis first — can both views be combined?
5. If not, the **Product Manager** makes the call with documented trade-offs
6. The **Project Manager** records the decision and dissenting opinions

### 4. Cross-Functional Feedback Loops
Agents don't just hand off work — they stay involved:
- **UX Researcher** challenges PM assumptions with user evidence
- **Product Designer** pushes back on PM scope if it hurts UX quality
- **Interaction Designer** challenges Product Designer on feasibility and edge cases
- **Full-Stack Architect** reviews all technical decisions, schema changes, and architectural proposals — has veto power on technical direction
- **Frontend Engineers** push back on designs that are impractical to build performantly
- **Backend Engineers** challenge frontend data assumptions and propose better contracts
- **QA Tester** participates from the START, not just at the end — "How will we test this?" is asked during design, not after implementation
- **Project Manager** intervenes when debate is circular, when someone is being unheard, or when the team is bike-shedding

### 5. Productive Conflict Norms
- Attack ideas, never people: "This approach has a flaw" not "You made a mistake"
- Steel-man before you critique: restate the other agent's position charitably before disagreeing
- Disagree with evidence: "Users in [study X] behaved differently" or "This pattern fails at scale because..."
- Commit after debate: once a decision is made, everyone executes — even if they disagreed
- Revisit if wrong: if new evidence emerges, any agent can reopen a closed decision

### 6. Red Team Protocol
For critical decisions, the **Project Manager** assigns a "red team" agent whose job is to:
- Find every flaw in the proposal
- Argue for the opposite approach
- Identify what could go wrong
- Stress-test assumptions with worst-case scenarios
This is not adversarial — it's protective. The red team agent rotates.

---

## Orchestration Flow

The **Advanced Project Manager** sits at the center and orchestrates all collaboration. No agent works in isolation. See `agents/project-manager.md` for full protocols (kickoff, critique, conflict resolution, handoff).

### Phase 1: Discovery
```
Project Manager initiates
  → UX Researcher presents findings / assumptions
  → PM challenges with business context
  → Designer raises UX concerns
  → Engineers flag technical constraints
  → QA asks "How do we validate this?"
  → DEBATE until alignment (or PM decides)
```

### Phase 2: Definition
```
PM writes PRD
  → Architect translates FRs into technical architecture (schema, data flow, component boundaries)
  → UX Researcher validates against research
  → Designer challenges scope / UX gaps
  → Engineers estimate and flag risks (Architect arbitrates disagreements)
  → QA writes preliminary test scenarios
  → Project Manager ensures convergence
  → REVISE until PRD + technical blueprint are solid
```

### Phase 3: Design
```
Product Designer creates specs
  → Interaction Designer adds behavior specs
  → UX Researcher validates against user mental models
  → Engineers review for feasibility
  → QA identifies testability gaps
  → CRITIQUE ROUND: each reviewer provides 1+ challenge
  → Iterate until sign-off from all reviewers
```

### Phase 4: Implementation
```
Architect defines module boundaries, hook contracts, and data flow before coding starts
  → Engineers create feature branch (feature/task-name) from main
  → Frontend Engineers build (UI + Data in parallel)
  → Backend Engineers build API + infra
  → Engineers write unit tests for new logic (Vitest, src/__tests__/)
  → Architect reviews schema migrations, critical paths, and architectural compliance
  → Designers review implementation vs spec
  → QA writes and executes tests alongside development
  → Push branch → open Pull Request
  → CI automatically runs: lint → test → build (GitHub Actions)
  → Code review: cross-review between engineers + Architect review for critical paths
  → All CI checks green + review approved → merge to main
  → Vercel auto-deploys from main
  → Project Manager tracks progress and unblocks
```

### Phase 5: Quality
```
QA executes full test plan
  → Engineers fix issues
  → Designers verify visual/interaction fidelity
  → UX Researcher validates against original user needs
  → PM confirms acceptance criteria met
  → Project Manager signs off for release
```

---

## Decision Log

All significant decisions are recorded using this format:

```markdown
### Decision: [Title]
- **Date**: YYYY-MM-DD
- **Decided by**: [Role]
- **Context**: What problem we were solving
- **Options**: What alternatives we considered
- **Decision**: What we chose and why
- **Dissent**: Who disagreed and their reasoning
- **Revisit if**: When to reconsider this decision
```

Store decisions in `docs/decisions/` as individual files.

---

## Design System Rules — shadcn/ui (MANDATORY)

All agents producing UI code or reviewing designs **must** follow these rules. No exceptions.

### Component Library

- **Use shadcn/ui** (new-york style) as the only component library. Never introduce third-party UI kits (Material UI, Ant Design, Chakra, etc.).
- **Install new primitives** via `pnpm dlx shadcn@latest add <component>`. Never copy-paste from docs manually.
- Installed primitives live in `src/components/ui/`. **Do not modify these files** unless extending a variant — prefer wrapping in app-level components in `src/components/` instead.
- App-level components compose shadcn/ui primitives. Example: `src/components/ShipmentCard.tsx` uses `Card`, `Button`, `Badge` from `src/components/ui/`.

### Styling

- **Tailwind CSS 4** only — no inline styles, no CSS modules, no styled-components.
- Always use the `cn()` helper from `@/lib/utils` for conditional/merged classes.
- Use **design tokens** (CSS variables) for colors — never use raw hex/rgb values:
  - `bg-background`, `text-foreground`, `border-border` — not `bg-white`, `text-gray-900`
  - `bg-primary`, `text-primary-foreground` — not `bg-gray-900`, `text-white`
  - `bg-destructive`, `text-destructive` — not `bg-red-500`
  - `bg-muted`, `text-muted-foreground` — for subdued/secondary content
- Use the **radius tokens** (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`) — they map to the project's `--radius` variable. Never use arbitrary values like `rounded-[10px]`.
- Color space is **OKLch**. When defining new tokens, use `oklch()` values to match existing ones.

### Dark Mode

- All UI must work in both light and dark modes.
- Dark mode uses the `.dark` class strategy via `@custom-variant dark (&:is(.dark *))`.
- Rely on CSS variable token pairs (light/dark defined in `src/index.css`) — components automatically adapt. Never hardcode light-only or dark-only colors.

### Typography

- **Font**: Inter (loaded via system font stack).
- **Body text**: `text-sm` (14px) as the default.
- **Headings**: `font-semibold` + appropriate `text-*` size. Use `leading-none` for card/section titles.
- **Muted text**: `text-muted-foreground` — for descriptions, secondary info.

### Icons

- **Lucide React** is the only icon library. Never use FontAwesome, Heroicons, etc.
- Import icons individually for tree-shaking: `import { TruckIcon } from "lucide-react"`.
- Default icon size inside buttons is handled automatically (`size-4` via `has-[>svg]`).

### Button Variants

Use the correct semantic variant — never style buttons manually:

| Variant | Use for |
|---------|---------|
| `default` | Primary actions (Submit, Save, Create) |
| `secondary` | Secondary actions (Cancel, Back) |
| `outline` | Tertiary/neutral actions (Filter, Export) |
| `ghost` | Toolbar actions, inline actions, icon-only buttons |
| `destructive` | Dangerous actions (Delete, Remove) — always confirm first |
| `link` | Navigation styled as text links |

Sizes: `default` (h-9), `sm` (h-8), `lg` (h-10), `xs`, `icon`, `icon-sm`, `icon-xs`, `icon-lg`.

### Card Composition

Cards follow this structure — do not deviate:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
    <CardAction> {/* optional top-right slot */}
      <Button variant="ghost" size="icon-sm">...</Button>
    </CardAction>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>  {/* optional */}
</Card>
```

### Notifications

- Use **Sonner** toasts exclusively — never `window.alert()` or custom modals for transient messages.
- Import `toast` from `sonner`: `toast.success("Saved")`, `toast.error("Failed")`.
- The global `<Toaster />` is already mounted in `main.tsx`.

### Accessibility

- All interactive elements must have visible focus rings (already built into shadcn/ui — do not override `focus-visible` styles).
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, proper heading hierarchy.
- Use `aria-label` on icon-only buttons.
- Support `aria-invalid` states on form inputs (built into shadcn/ui primitives).
- Ensure sufficient color contrast — the OKLch token pairs are pre-validated for WCAG AA.

### Data Fetching (UI Context)

- Use **TanStack React Query** for all server state. Never use `useState` + `useEffect` for data fetching.
- Default stale time is 1 minute, retry is 1 (configured in `main.tsx`).
- Loading/error states must be handled in every query consumer — never show blank screens.

### Path Aliases

Always use aliases — never relative paths across boundaries:

```
@/            → src/
@/components  → src/components
@/ui          → src/components/ui
@/lib         → src/lib
@/hooks       → src/hooks
```

### Patterns to Avoid

- **No arbitrary Tailwind values** (`text-[#123456]`, `w-[327px]`) — use tokens or standard scale.
- **No `!important`** — fix specificity issues properly.
- **No wrapper divs for styling** — use Tailwind directly on semantic elements.
- **No component libraries besides shadcn/ui** — if a primitive doesn't exist, install it or build it using Radix UI.
- **No global CSS classes** beyond what's in `src/index.css` `@layer base` — use Tailwind utilities.
