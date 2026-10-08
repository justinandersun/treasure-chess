/** Board geometry: squares, files, ranks, and colors. */

export type Color = 'w' | 'b';

/** Square index 0..63. a1 = 0, b1 = 1, …, h1 = 7, a2 = 8, …, h8 = 63. */
export type Square = number;

/** Returned by {@link offsetSquare} when the target is off the board. */
export const NO_SQUARE = -1;

export const FILES = 'abcdefgh';

export function fileOf(sq: Square): number {
  return sq & 7;
}

export function rankOf(sq: Square): number {
  return sq >> 3;
}

export function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function makeSquare(file: number, rank: number): Square {
  return rank * 8 + file;
}

/** The square `df` files and `dr` ranks away from `sq`, or {@link NO_SQUARE}. */
export function offsetSquare(sq: Square, df: number, dr: number): Square {
  const file = fileOf(sq) + df;
  const rank = rankOf(sq) + dr;
  return isOnBoard(file, rank) ? makeSquare(file, rank) : NO_SQUARE;
}

export function squareName(sq: Square): string {
  return `${FILES[fileOf(sq)]}${rankOf(sq) + 1}`;
}

export function parseSquare(name: string): Square {
  const match = /^([a-h])([1-8])$/.exec(name);
  if (!match) throw new Error(`Invalid square name: ${name}`);
  return makeSquare(FILES.indexOf(match[1]!), Number(match[2]) - 1);
}

/** a1 is dark. */
export function isLightSquare(sq: Square): boolean {
  return (fileOf(sq) + rankOf(sq)) % 2 === 1;
}

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

/** Rank direction a color's infantry advances in. */
export function forward(color: Color): 1 | -1 {
  return color === 'w' ? 1 : -1;
}

/** Rank index (0-based) of a color's pawn row. */
export function pawnRank(color: Color): number {
  return color === 'w' ? 1 : 6;
}

/** Rank index (0-based) of a color's back rank. */
export function backRank(color: Color): number {
  return color === 'w' ? 0 : 7;
}

/** Rank index (0-based) where a color's infantry promote: the opponent's back rank. */
export function promotionRank(color: Color): number {
  return backRank(opposite(color));
}
