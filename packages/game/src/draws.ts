/**
 * Dead-position detection. A position is dead when no sequence of legal moves can end in checkmate.
 * Detection is deliberately conservative: it only reports positions proven dead, and everything
 * else is treated as playable.
 */

import { isLightSquare } from './board';
import { type MoveComponent, PIECES, type PieceType } from './pieces';
import type { Board } from './position';

const isEven = ([df, dr]: readonly [number, number]) => (df + dr) % 2 === 0;

function componentIsColorBound(component: MoveComponent): boolean {
  switch (component.kind) {
    case 'leap':
      return component.offsets.every(isEven);
    case 'slide':
      return component.directions.every(isEven);
    case 'bent':
      return component.paths.every((p) => isEven(p.step) && p.slides.every(isEven));
    case 'infantry':
      return false;
  }
}

/**
 * Whether a piece type can only ever stand on, and attack, squares of one color — every move
 * vector changes file + rank by an even amount (Bishop, Priest, Camel).
 */
export function isColorBound(type: PieceType): boolean {
  return PIECES[type].movement.every(componentIsColorBound);
}

/**
 * Non-royal piece types that cannot deliver checkmate with only their King's help against a lone
 * King: no checkmate position exists at all for King + piece vs King. The test suite verifies this
 * list exhaustively by enumerating every placement of the three pieces.
 */
export const CANNOT_MATE_ALONE: ReadonlySet<PieceType> = new Set<PieceType>([
  'priest',
  'bishop',
  'cardinal',
  'camel',
  'knight',
]);

/**
 * Whether the position is dead. Proven-dead cases:
 *
 * 1. **King vs King.**
 * 2. **King + one piece vs King**, where that piece type is in {@link CANNOT_MATE_ALONE}.
 * 3. **Only color-bound pieces, all on one square color** (either side, any number; no infantry).
 *    Proof: a checking piece attacks only squares of its own color, so a checkmated King must stand
 *    on that color. Its orthogonal neighbors are the other color, so no piece can attack them or
 *    stand on them; only the attacking King could cover them. On every square — corner, edge, or
 *    interior — the King has at least two such neighbors, and the only squares adjacent to all of
 *    them are adjacent to the King itself, where the attacking King may not stand. So the King
 *    always has an escape square, and checkmate is impossible. Color-bound pieces never change
 *    square color and no infantry remain to promote, so this holds for the rest of the game.
 *
 * Any position with infantry is never declared dead.
 */
export function isDeadPosition(board: Board): boolean {
  const pieces = board.filter((p) => p !== null && !PIECES[p.type].royal);
  if (pieces.length === 0) return true;
  if (pieces.some((p) => PIECES[p!.type].family === 'infantry')) return false;
  if (pieces.length === 1 && CANNOT_MATE_ALONE.has(pieces[0]!.type)) return true;

  let color: boolean | null = null;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || PIECES[p.type].royal) continue;
    if (!isColorBound(p.type)) return false;
    const light = isLightSquare(sq);
    if (color === null) color = light;
    else if (color !== light) return false;
  }
  return true;
}
