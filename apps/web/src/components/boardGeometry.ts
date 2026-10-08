import { type Color, fileOf, makeSquare, rankOf, type Square } from '@treasure-chess/game';

/** Squares in display order: top-left first, row by row, as seen by `orientation`'s player. */
export function displaySquares(orientation: Color): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      squares.push(orientation === 'w' ? makeSquare(col, 7 - row) : makeSquare(7 - col, row));
    }
  }
  return squares;
}

/** Display row and column (0 = top / left) of a square. */
export function displayPosition(sq: Square, orientation: Color): { row: number; col: number } {
  return orientation === 'w'
    ? { row: 7 - rankOf(sq), col: fileOf(sq) }
    : { row: rankOf(sq), col: 7 - fileOf(sq) };
}

function squareAt(row: number, col: number, orientation: Color): Square {
  return orientation === 'w' ? makeSquare(col, 7 - row) : makeSquare(7 - col, row);
}

const clamp = (n: number) => Math.max(0, Math.min(7, n));

/**
 * The square keyboard focus moves to from `sq` for `key`, in screen directions, or null if the key
 * is not a navigation key. Movement stops at the board edge.
 */
export function navigate(sq: Square, key: string, orientation: Color): Square | null {
  const { row, col } = displayPosition(sq, orientation);
  switch (key) {
    case 'ArrowUp':
      return squareAt(clamp(row - 1), col, orientation);
    case 'ArrowDown':
      return squareAt(clamp(row + 1), col, orientation);
    case 'ArrowLeft':
      return squareAt(row, clamp(col - 1), orientation);
    case 'ArrowRight':
      return squareAt(row, clamp(col + 1), orientation);
    case 'Home':
      return squareAt(row, 0, orientation);
    case 'End':
      return squareAt(row, 7, orientation);
    default:
      return null;
  }
}
