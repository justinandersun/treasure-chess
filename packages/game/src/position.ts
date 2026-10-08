/** Board contents plus side to move, and a compact text notation for positions. */

import { type Color, makeSquare, type Square } from './board';
import { type Piece, PIECES, piece, pieceTypeFromSymbol } from './pieces';

export type Board = (Piece | null)[];

export interface Position {
  readonly board: Board;
  readonly turn: Color;
}

export function emptyBoard(): Board {
  return new Array<Piece | null>(64).fill(null);
}

/**
 * Parses FEN-style placement and side to move, e.g. `"4k3/8/8/8/3Y4/8/8/4K3 w"`.
 * Ranks run from 8 down to 1; uppercase is White, lowercase is Black; letters are catalog symbols.
 */
export function parsePosition(text: string): Position {
  const [placement, turn = 'w', ...rest] = text.trim().split(/\s+/);
  if (!placement || rest.length > 0 || (turn !== 'w' && turn !== 'b')) {
    throw new Error(`Invalid position: ${text}`);
  }
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error(`Expected 8 ranks: ${text}`);

  const board = emptyBoard();
  rows.forEach((row, i) => {
    const rank = 7 - i;
    let file = 0;
    for (const ch of row) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const type = pieceTypeFromSymbol(ch);
      if (!type || file > 7) throw new Error(`Invalid rank "${row}" in: ${text}`);
      board[makeSquare(file, rank)] = piece(type, ch === ch.toUpperCase() ? 'w' : 'b');
      file += 1;
    }
    if (file !== 8) throw new Error(`Rank "${row}" does not have 8 files: ${text}`);
  });
  return { board, turn };
}

export function formatPosition(position: Position): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = position.board[makeSquare(file, rank)];
      if (!p) {
        empty += 1;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      const symbol = PIECES[p.type].symbol;
      row += p.color === 'w' ? symbol : symbol.toLowerCase();
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return `${rows.join('/')} ${position.turn}`;
}

export function pieceAt(position: Position, sq: Square): Piece | null {
  return position.board[sq] ?? null;
}
