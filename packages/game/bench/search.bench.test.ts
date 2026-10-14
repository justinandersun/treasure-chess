/** Measures search depth and speed within the default 1-second budget. */
import { it } from 'vitest';
import { findBestMove } from '../src/ai/search';
import { createGameFromArmies } from '../src/army';
import { playMove } from '../src/game';
import { toAlgebraic } from '../src/notation';
import { PRESETS } from '../src/presets';

it('search depth in one second', () => {
  for (const [w, b] of [
    [0, 0],
    [5, 1],
    [2, 3],
  ] as const) {
    let state = createGameFromArmies(PRESETS[w]!.deployment, PRESETS[b]!.deployment);
    const line: string[] = [];
    for (let ply = 0; ply < 6 && !state.result; ply++) {
      const start = performance.now();
      const r = findBestMove(state, { timeMs: 1000, seed: 7 })!;
      const ms = performance.now() - start;
      line.push(
        `${toAlgebraic(state, r.move)} (d${r.depth}, ${Math.round(r.nodes / (ms / 1000) / 1000)}k n/s, ${r.score})`,
      );
      state = playMove(state, r.move);
    }
    console.log(`${PRESETS[w]!.name} vs ${PRESETS[b]!.name}: ${line.join('  ')}`);
  }
});
