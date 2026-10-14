/**
 * Zobrist hashing: a 64-bit position fingerprint (two 32-bit halves) that can be updated
 * incrementally as pieces move. Used by the computer opponent to recognize repeated positions and
 * to cache search results.
 */

import type { Color, Square } from './board';
import { type Piece, PIECE_TYPES, type PieceType } from './pieces';
import type { Board } from './position';
import { createRng } from './rng';

const TYPE_INDEX = Object.fromEntries(PIECE_TYPES.map((t, i) => [t, i])) as Record<
  PieceType,
  number
>;

const KINDS = PIECE_TYPES.length * 2;
const random32 = (() => {
  const rng = createRng(0x7c3a5e1);
  return () => Math.floor(rng() * 0x1_0000_0000) >>> 0;
})();

const KEYS_LO = Uint32Array.from({ length: KINDS * 64 }, random32);
const KEYS_HI = Uint32Array.from({ length: KINDS * 64 }, random32);
export const SIDE_LO = random32();
export const SIDE_HI = random32();

/** Index of the key for `piece` standing on `sq`. */
export function keyIndex(piece: Piece, sq: Square): number {
  return (TYPE_INDEX[piece.type] * 2 + (piece.color === 'b' ? 1 : 0)) * 64 + sq;
}

export function keyLo(piece: Piece, sq: Square): number {
  return KEYS_LO[keyIndex(piece, sq)]!;
}

export function keyHi(piece: Piece, sq: Square): number {
  return KEYS_HI[keyIndex(piece, sq)]!;
}

/** Hash of a whole position, computed from scratch. Black to move toggles the side key. */
export function hashPosition(board: Board, turn: Color): { lo: number; hi: number } {
  let lo = turn === 'b' ? SIDE_LO : 0;
  let hi = turn === 'b' ? SIDE_HI : 0;
  board.forEach((p, sq) => {
    if (p) {
      lo ^= keyLo(p, sq);
      hi ^= keyHi(p, sq);
    }
  });
  return { lo: lo >>> 0, hi: hi >>> 0 };
}
