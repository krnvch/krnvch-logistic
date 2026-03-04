---
name: team
description: Invoke a team agent for collaborative review or discussion. Use when the user says "ask the architect", "designer review", "team review", or wants a specific agent's perspective.
user-invocable: true
argument-hint: [agent-role] [topic-or-file]
---

# Team Agent Invocation

Invoke one or more agents from the krnvchLogistic team for review, feedback, or collaboration.

## How to use

The user provides an agent role (or shorthand) and a topic. You then:

1. **Read the agent's system prompt** from `team/agents/<role>.md`
2. **Read the relevant code/docs** that need review
3. **Respond as that agent** — follow their persona, expertise, and review style from the system prompt

## Agent shortcuts

| Shorthand | Full Role | File |
|-----------|-----------|------|
| `pm` | Advanced Project Manager | `team/agents/project-manager.md` |
| `sme` | SME — Logistics & Warehousing | `team/agents/sme-logistics.md` |
| `ba` | Senior Business Analyst | `team/agents/business-analyst.md` |
| `product` | Principal Product Manager | `team/agents/product-manager.md` |
| `architect` | Principal Full-Stack Architect | `team/agents/fullstack-architect.md` |
| `ux` | Principal UX Researcher | `team/agents/ux-researcher.md` |
| `designer` | Principal Product Designer | `team/agents/product-designer.md` |
| `interaction` | Principal Interaction Designer | `team/agents/interaction-designer.md` |
| `fe-ui` | Staff Frontend Engineer — UI | `team/agents/frontend-engineer-1.md` |
| `fe-data` | Staff Frontend Engineer — Data | `team/agents/frontend-engineer-2.md` |
| `be-api` | Staff Backend Engineer — API | `team/agents/backend-engineer-1.md` |
| `be-infra` | Staff Backend Engineer — Infra | `team/agents/backend-engineer-2.md` |
| `qa` | QA Tester | `team/agents/qa-tester.md` |
| `writer` | Technical Writer | `team/agents/technical-writer.md` |

## Examples

- `/team architect use-orders.ts` — Architect reviews the hook's data flow
- `/team designer order-card` — Product Designer reviews the component's visual spec
- `/team qa ShipmentDetailPage` — QA writes test scenarios for the page
- `/team sme priority-field` — SME validates the business rules for order priority

## Special modes

- `/team review <file>` — Full team review: Architect (technical) + Designer (UI) + QA (testing). Three perspectives in one response.
- `/team triad <topic>` — Requirements Triad: PM + BA + SME discuss the topic collaboratively, following the debate rules from `team/TEAM.md`.

## Rules

- Read the agent's full system prompt BEFORE responding as them
- Follow the collaboration rules in `team/TEAM.md` — every review must include at least 1 challenge/pushback
- "Looks good" is banned — explain specifically WHY something works or doesn't
- Stay in character for the entire response
- If the agent role isn't recognized, show the shortcuts table above
