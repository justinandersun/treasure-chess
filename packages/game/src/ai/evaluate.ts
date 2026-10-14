/**
 * Static evaluation for the computer opponent, in centipawns from the side to move's view.
 *
 * - Material: each piece is worth its draft cost × 100 (the King is priceless, so 0 here).
 * - Placement: a piece earns a bonus on squares where it has more moves on an empty board, so
 *   every fairy piece is centralized appropriately without hand-written tables.
 * - Infantry: a growing bonus for advancing toward promotion.
 * - King: stays home behind its infantry while there is plenty of material; centralizes in the
 *   endgame.
 */

import { type Color, fileOf, forward, makeSquare, rankOf, type Square } from '../board';
import { pseudoLegalMovesFrom } from '../movegen';
import { PIECE_TYPES, PIECES, piece, type PieceType } from '../pieces';
import { emptyBoard } from '../position';
import type { SearchPosition } from './searchPosition';

export const PIECE_VALUE = Object.fromEntries(
  PIECE_TYPES.map((t) => [t, PIECES[t].royal ? 0 : PIECES[t].cost * 100]),
) as Record<PieceType, number>;

const MOBILITY_WEIGHT = 4;
/** Bonus by ranks advanced from the pawn row (index 0 = still on the pawn row). */
const ADVANCE_BONUS = [0, 6, 14, 28, 50, 80];
/** Officer material (both sides) at or above which it is fully the middlegame. */
const MIDDLEGAME_MATERIAL = 4000;

/** Placement bonus per piece type and square, from empty-board mobility (White's view). */
const PLACEMENT: Record<PieceType, Int16Array> = (() => {
  const table = {} as Record<PieceType, Int16Array>;
  for (const type of PIECE_TYPES) {
    const counts = Array.from({ length: 64 }, (_, sq) => {
      const board = emptyBoard();
      board[sq] = piece(type, 'w');
      return pseudoLegalMovesFrom(board, sq).length;
    });
    const mean = counts.reduce((a, b) => a + b, 0) / 64;
    const infantry = PIECES[type].family === 'infantry';
    table[type] = Int16Array.from(counts, (n, sq) => {
      if (PIECES[type].royal) return 0;
      if (infantry) {
        const advanced = Math.max(0, rankOf(sq) - 1);
        const central = 3.5 - Math.abs(fileOf(sq) - 3.5);
        return (ADVANCE_BONUS[Math.min(advanced, 5)] ?? 0) + Math.round(central * 2);
      }
      return Math.round((n - mean) * MOBILITY_WEIGHT);
    });
  }
  return table;
})();

/** Rank counted from `color`'s own side (0 = its back rank). */
function relativeRank(sq: Square, color: Color): number {
  return color === 'w' ? rankOf(sq) : 7 - rankOf(sq);
}

function mirror(sq: Square): Square {
  return makeSquare(fileOf(sq), 7 - rankOf(sq));
}

function kingSafety(pos: SearchPosition, sq: Square, color: Color, middlegame: number): number {
  const rank = relativeRank(sq, color);
  const centerDistance = Math.max(Math.abs(fileOf(sq) - 3.5), Math.abs(rankOf(sq) - 3.5));
  // Middlegame: stay on the back rank, sheltered by friendly infantry.
  let shelter = 0;
  const ahead = rankOf(sq) + forward(color);
  if (ahead >= 0 && ahead < 8) {
    for (let f = fileOf(sq) - 1; f <= fileOf(sq) + 1; f++) {
      if (f < 0 || f > 7) continue;
      const p = pos.board[makeSquare(f, ahead)];
      if (p?.color === color && PIECES[p.type].family === 'infantry') shelter += 10;
    }
  }
  const mg = shelter - rank * 18;
  // Endgame: head for the center.
  const eg = Math.round((3.5 - centerDistance) * 12);
  return Math.round(mg * middlegame + eg * (1 - middlegame));
}

/** Evaluation in centipawns from the side to move's perspective. */
export function evaluate(pos: SearchPosition): number {
  const { board } = pos;
  let score = 0;
  let officerMaterial = 0;
  const kings: Partial<Record<Color, Square>> = {};

  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p) continue;
    const def = PIECES[p.type];
    if (def.royal) {
      kings[p.color] = sq;
      continue;
    }
    const value = PIECE_VALUE[p.type] + PLACEMENT[p.type][p.color === 'w' ? sq : mirror(sq)]!;
    score += p.color === 'w' ? value : -value;
    if (def.family !== 'infantry') officerMaterial += PIECE_VALUE[p.type];
  }

  const middlegame = Math.min(1, officerMaterial / MIDDLEGAME_MATERIAL);
  if (kings.w !== undefined) score += kingSafety(pos, kings.w, 'w', middlegame);
  if (kings.b !== undefined) score -= kingSafety(pos, kings.b, 'b', middlegame);

  return pos.turn === 'w' ? score : -score;
}
