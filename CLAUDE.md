# Treasure Chess — working notes

- Spec: `treasure-chess-spec.md` (do not reformat; excluded from Prettier). Milestone plan lives outside the repo; spec interpretations are recorded as tests in `packages/game`.
- Monorepo: pnpm workspaces. `packages/game` is a pure TS rules engine (no DOM, no React); `apps/web` is React + Vite and imports it as `@treasure-chess/game` (source, no build step).
- Node 24. If the shell resolves an older Node (nvm), run `nvm use` or prefix `PATH="$HOME/.volta/bin:$PATH"`.
- Commands: `pnpm check` (typecheck + lint + format check + tests), `pnpm dev`, `pnpm build`, `pnpm format`.
- Workflow: write code and run `pnpm check`; the user tests manually and commits to main. Do not commit or push.
- Conventions: strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), single quotes, 100-col Prettier. Tests sit next to source as `*.test.ts`.
