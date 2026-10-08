/** Shared helpers for tests. Not exported from the package index. */

import { type Color, parseSquare, squareName } from './board';
import { attackedSquares, pseudoLegalMovesFrom } from './movegen';
import { piece, type PieceType } from './pieces';
import { emptyBoard, formatPosition, parsePosition } from './position';

/** Sorted destination square names for the piece on `from` in `fen`. */
export function destinations(fen: string, from: string): string[] {
  const { board } = parsePosition(fen);
  return pseudoLegalMovesFrom(board, parseSquare(from))
    .map((m) => squareName(m.to))
    .sort();
}

/** Sorted capture square names for the piece on `from` in `fen`. */
export function captures(fen: string, from: string): string[] {
  const { board } = parsePosition(fen);
  return pseudoLegalMovesFrom(board, parseSquare(from))
    .filter((m) => m.captured)
    .map((m) => squareName(m.to))
    .sort();
}

/** Sorted attacked square names for the piece on `from` in `fen`. */
export function attacks(fen: string, from: string): string[] {
  const { board } = parsePosition(fen);
  return attackedSquares(board, parseSquare(from)).map(squareName).sort();
}

/** Position text with a single piece of `type` on `square`. */
export function lonePiece(type: PieceType, square: string, color: Color = 'w'): string {
  const board = emptyBoard();
  board[parseSquare(square)] = piece(type, color);
  return formatPosition({ board, turn: color });
}

/** Splits a space-separated list of square names into a sorted array. */
export function squares(list: string): string[] {
  return list.split(/\s+/).filter(Boolean).sort();
}

/** Deterministic PRNG (mulberry32) for reproducible randomized tests. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
