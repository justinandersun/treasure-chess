# Treasure Chess

Treasure Chess is a free, browser-based chess variant in which players draft and arrange custom armies of fairy pieces before playing on a standard 8×8 chessboard.

**Draft → Place → Play.** Spend 40 gold on an army, arrange it on your first two ranks, and play a friend on the same device or the built-in computer opponent. No accounts, ads, or tracking; your game is saved in your browser.

The full rules and product spec are in [treasure-chess-spec.md](treasure-chess-spec.md).

## How to play

1. **Draft.** Buy exactly one King, eight infantry for the pawn row (Pawns, Scouts, and Sergeants in any mix), and one to seven other pieces. Total cost may not exceed 40 gold. Presets are available for a quick start.
2. **Place.** Infantry fill the pawn row; everything else goes on the back rank, with the King on the d- or e-file. In two-player games each army is placed in private and revealed together.
3. **Play.** Normal chess, with no castling, en passant, or clock. Infantry promote on the far rank to any non-King piece type from their starting army. Checkmate wins; stalemate, repetition, the 50/75-move rules, and dead positions draw.

### Pieces

| Family   | Piece    | Gold | Movement                                                           |
| -------- | -------- | ---: | ------------------------------------------------------------------ |
| Infantry | Pawn     |    1 | Standard chess pawn                                                |
| Infantry | Scout    |    1 | Moves diagonally forward; captures straight forward                |
| Infantry | Sergeant |    2 | Moves and captures one square in any forward direction             |
| Rook     | Bastion  |    3 | One or two squares orthogonally; can jump                          |
| Rook     | Rook     |    5 | Standard chess rook                                                |
| Rook     | Gryphon  |    6 | One diagonal step, then may slide outward orthogonally             |
| Bishop   | Priest   |    2 | One or two squares diagonally; can jump                            |
| Bishop   | Bishop   |    3 | Standard chess bishop                                              |
| Bishop   | Cardinal |    5 | One orthogonal step, then may slide outward diagonally             |
| Knight   | Camel    |    2 | (1,3) jumper                                                       |
| Knight   | Knight   |    3 | Standard chess knight                                              |
| Knight   | Elephant |    6 | Knight + Camel jumps                                               |
| Royalty  | Consort  |    3 | One square in any direction                                        |
| Royalty  | Falconer |    8 | Jumps exactly two squares: orthogonally, diagonally, or knightwise |
| Royalty  | Queen    |    9 | Standard chess queen                                               |
| Royalty  | King     |    1 | Standard chess king, without castling                              |

The in-app **Rules** screen has movement diagrams for every piece.

## Development

Requires Node 24 (pinned via `.nvmrc` and Volta) and pnpm.

```bash
pnpm install
pnpm dev        # start the web app at http://localhost:5173
pnpm check      # typecheck, lint, format check, unit tests
pnpm build      # production build in apps/web/dist
pnpm e2e        # end-to-end tests (first run: pnpm --filter @treasure-chess/web exec playwright install chromium)
```

### Project layout

- **`packages/game`** — the rules engine, in pure TypeScript with no DOM: piece catalog and move generation, legality, promotion, draws, army validation, notation, saved-game format, presets, and the computer opponent (`src/ai`). Unit tests sit next to the source; `pnpm --filter @treasure-chess/game bench` measures move-generation and search speed.
- **`apps/web`** — the React + Vite front end: screens, board, piece artwork (`src/pieces/pieceArt.ts`), session persistence (`src/persistence`), and the computer opponent's Web Worker (`src/ai`). Playwright tests live in `apps/web/e2e`.

### Testing

- **Unit tests** (Vitest) cover the rules — including perft counts that match published orthodox-chess results — plus the web app's state machines and persistence.
- **End-to-end tests** (Playwright) run against the production build on desktop and phone viewports: full two-player and computer games, reloads, keyboard play, and automated accessibility checks (axe) in light and dark mode.
- CI runs both on every push to `main`.

### Images

After changing piece artwork, regenerate the link-preview image and home-screen icon in `apps/web/public/` and commit them:

```bash
pnpm --filter @treasure-chess/web images
```

## Deployment

The app is a static site deployed to Vercel from GitHub: every push to `main` deploys to production, and pull requests get preview deployments. Link-preview tags use the production domain automatically (`VERCEL_PROJECT_PRODUCTION_URL`).

## Credits

Built by [Justin Andersun](https://andersun.com). Piece artwork is original to this project.
