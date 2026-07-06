# Project Rules

## Waterpumper Project

Multi-service dashboard for managing water pumping infrastructure. Monorepo with three surface areas.

### Structure

| Path | What |
|---|---|
| `prototype/` | Next.js app (App Router) — main user-facing application |
| `dashboard/` | Vite + vanilla JS app — operational dashboard |
| `api/` | Serverless / edge API handlers |

### Agent behavior

- **Skills live in `.omp/skills/`** (symlinked from `.pi/skills/` for backward compat).
- **Impeccable** (`reference/`) is the primary design skill — loaded from `.omp/skills/impeccable/`.
- **Hindsight memory** at `.omp/hindsight-memory/` — cross-session knowledge store.
- **MCP servers** configured in `.mcp.json` (chrome-devtools, obscura).
- **Project env** in `.env.local` (prototype) — never commit.

### Patterns

- Prototype uses Next.js App Router with Server Components where possible.
- Dashboard is Vite + vanilla JS — no framework.
- API routes go in `prototype/api/`.
- All new UI work goes through `prototype/`.
