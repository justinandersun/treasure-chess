# Treasure Chess

Treasure Chess is a free, browser-based chess variant in which players draft and arrange custom armies of fairy pieces before playing on a standard 8×8 chessboard.

See [treasure-chess-spec.md](treasure-chess-spec.md) for the full rules and product spec.

## Development

Requires Node 24 (pinned via `.nvmrc` and Volta) and pnpm.

```bash
pnpm install
pnpm dev        # start the web app
pnpm check      # typecheck, lint, format check, tests
```

### Layout

- `packages/game` — pure TypeScript rules engine (no DOM). Tested with Vitest.
- `apps/web` — React + Vite front end.
