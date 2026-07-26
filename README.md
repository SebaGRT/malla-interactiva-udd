# Malla Interactiva UDD

Interactive curriculum planner for **Universidad del Desarrollo** — a TypeScript rewrite inspired by [Malla Interactiva](https://github.com/BooterMan98/malla-interactiva) (originally built for USM).

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Fastify + SQLite + OpenAPI
- **Frontend**: React + Vite
- **Shared**: Zod schemas, domain logic, validation
- **Deploy**: Docker / docker-compose, [Vercel](#vercel)

## Project structure

```
malla-interactiva-udd/
├── data/iit/              # Source curriculum JSON
├── data/malla.db          # SQLite (generated, gitignored)
├── packages/
│   ├── shared/            # Types, schemas, domain logic
│   ├── backend/           # Fastify API
│   └── frontend/          # React app
└── docs/                  # Source PDFs
```

## Prerequisites

- Node.js 20+
- pnpm 10+

## Getting started

```bash
pnpm install
pnpm db:import    # JSON → SQLite (auto-runs on first server start too)
pnpm dev          # API at http://localhost:3001
pnpm dev:frontend # UI at http://localhost:5173 (proxies /api → backend)
```

### OpenAPI

Interactive docs at **http://localhost:3001/docs**

Raw spec at **http://localhost:3001/docs/json**

### Database

Curriculum JSON in `data/iit/` is the source of truth. Import into SQLite:

```bash
pnpm db:import
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `data/malla.db` | SQLite file path |
| `DB_AUTO_SEED` | `true` | Import JSON when DB is empty on startup |

After editing `curriculum.json`, re-run `pnpm db:import` and restart the server.

### Docker

```bash
docker compose up --build
```

### Vercel

The frontend is a static Vite build; the API runs as a single serverless function at `/api/*`. On Vercel, curriculum data is loaded from `data/*/curriculum.json` (no SQLite).

1. Import the repo in [Vercel](https://vercel.com/new).
2. Use the defaults from `vercel.json` (install: `pnpm install`, build: `pnpm run build:vercel`, output: `packages/frontend/dist`).
3. Deploy.

Local preview of the production layout (API + static UI):

```bash
pnpm install
pnpm run build:vercel
npx vercel dev
```

Optional environment variables:

| Variable | Vercel default | Description |
|----------|----------------|-------------|
| `CURRICULUM_SOURCE` | `json` | Load careers from JSON files (required on Vercel) |
| `DATA_DIR` | `./data` | Path to curriculum JSON folders |

After editing `data/iit/curriculum.json`, commit and redeploy — no `db:import` step on Vercel.

### Tests & validation

```bash
pnpm test
pnpm validate:curriculum
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/docs` | OpenAPI UI |
| `GET` | `/careers` | List careers |
| `GET` | `/careers/:code/curriculum` | Full curriculum + categories |
| `POST` | `/careers/:code/eligibility` | Course unlock status |
| `POST` | `/careers/:code/credits` | Credit progress |
| `GET` | `/careers/:code/validate` | Validation report |

## Curriculum data

Hybrid schedule (`meta.scheduling`): semesters **s1–s4**, then trimesters **t9–t20**.

Degree total: **561 credits** (includes **32** extradisciplinarios as EEL courses in the grid).

`pnpm validate:curriculum` runs integrity checks on the JSON source.

## Credits

Inspired by [Malla Interactiva](https://github.com/BooterMan98/malla-interactiva), originally by Sebastián Aedo and the USM open-source community.

## License

TBD
