# Zenya — project instructions for Claude

## Design & styling: always use the Taste skill (`design-taste-frontend`)

An anti-slop frontend skill is installed at `.claude/skills/design-taste-frontend`
(→ `.agents/skills/design-taste-frontend/SKILL.md`). **Use it automatically —
without being asked — whenever the work touches visual design.**

**Always load and follow it for** any styling/layout/UI work on the design-facing
surfaces:
- the marketing site (`app/(main)/**`, `components/marketing/**`, `components/Hero.tsx`, landing sections)
- the 8 generated site templates (`components/theme/**`, restaurant/atlas/lookbook/wellness/studio/services/storefront, and their previews)
- any new landing page, portfolio, hero, or redesign

How: at the start of such a task, read the SKILL.md and apply it — state the
one-line "Design Read", set the three dials (VARIANCE / MOTION / DENSITY) from the
brief, and honor its anti-slop rules (no AI-purple gradients, no generic centered
3-card hero, no default Inter+slate, real design systems when applicable).

**Scope caveat (from the skill itself):** it is built for landing pages,
portfolios, and redesigns — **not** dashboards, data tables, or dense product UI.
For internal dashboard surfaces (`app/(app)/dashboard/**`, `components/dashboard/**`,
`components/app/**`) apply only its *universal* principles (kill AI-slop aesthetics,
good typography/spacing, restrained motion) — do **not** impose its high-variance /
cinematic-motion presets there; that UI is intentionally dense and utilitarian.

If a design task is ambiguous, follow the skill's rule: state the design read and
proceed; ask at most one clarifying question only when the direction genuinely
diverges.
