/** Measures move-generation speed. Run with `pnpm --filter @treasure-chess/game bench`. */
import { it } from 'vitest';
import { parsePosition } from '../src/position';
import { perft, promotionTypesFromBoard } from '../src/rules';

const CASES = [
  ['standard start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w', 4],
  ['fairy start', 'ry1okqn1/gspsgpsp/8/8/8/8/PSGPPGSP/TMICKFYE w', 4],
  ['fairy middlegame', 'k1r5/1S1Y4/8/3c4/8/2F5/1g3E2/4K3 w', 4],
] as const;

it('perft speed', () => {
  for (const [name, fen, depth] of CASES) {
    const pos = parsePosition(fen);
    const types = promotionTypesFromBoard(pos.board);
    const start = performance.now();
    const nodes = perft(pos, types, depth);
    const ms = performance.now() - start;
    console.log(
      `${name.padEnd(18)} depth ${depth}: ${nodes.toLocaleString().padStart(10)} nodes in ${ms.toFixed(0).padStart(5)} ms = ${Math.round(nodes / (ms / 1000)).toLocaleString()} nodes/s`,
    );
  }
});
