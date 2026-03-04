---
name: learn
description: Add a new entry to docs/learning-log.md after completing a task. Use when the user says "add to learning log", "write what I learned", or after finishing a feature.
user-invocable: true
argument-hint: [task-number-or-title]
---

# Learning Log Writer

You help document what was learned from each development task.
The learning log is written in **Russian** — this is a personal educational journal.

## Step-by-step

1. **Understand what was done** — read recent git history, changed files, and any related docs (PRD, architecture):
   - `git log --oneline -10` for recent commits
   - Read the changed/added files to understand the implementation
   - Check `docs/TODO.md` for the task number and description

2. **Read the current learning log** — `docs/learning-log.md` — to match the exact format.

3. **Write the entry** using this structure (in Russian):

```markdown
## [Task#] [Title] — DD.MM.YYYY

### Что сделали

One paragraph explaining the PROBLEM that existed and what was done to solve it.
Write from the user's perspective — what changed for them.

### Что появилось

- **Feature 1** — brief description of what it does
- **Feature 2** — brief description
- (bullet list of visible changes)

### Что узнал

- **Concept 1** — detailed explanation of the technical concept learned. Not just "we used X" but HOW it works and WHY.
- **Concept 2** — another learning, explained in simple terms with analogies.
- (Each bullet should teach something — this is the core of the log)

### Аналогия из дизайна

A paragraph that draws a parallel between the technical concept and something from the design world (Figma, design systems, etc.). This helps the reader (who has a design background) connect new technical knowledge to familiar concepts.

### Технически

- N new files, M changed files
- Key dependencies or tools used
- Link to PR if available
```

4. **Insert** the new entry after the `---` separator at the top (before the most recent entry).

## Rules

- Write in **Russian** — the entire learning log is in Russian
- Explain concepts **simply** — assume the reader is learning web development
- Always include the **design analogy** — the project owner comes from a design background
- Focus on the **"why"** not just the "what" — explain WHY things work a certain way
- Reference specific files and functions when explaining concepts
- Use the task number from `docs/TODO.md` when available (e.g., "4.1 Тёмная тема")
- Date format: DD.MM.YYYY
