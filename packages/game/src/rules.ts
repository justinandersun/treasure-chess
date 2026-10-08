/**
 * Legal move generation on a mutable board: King safety, promotion, make/unmake, and perft.
 * This layer favors speed (in-place updates) for use by search; see game.ts for the immutable API.
 */

import { type Color, opposite, promotionRank, rankOf, type Square } from './board';
import { isSquareAttacked, type Move, pseudoLegalMoves } from './movegen';
import { PIECE_TYPES, PIECES, piece, type PieceType } from './pieces';
import type { Board, Position } from './position';

/** Piece types each side may promote to. */
export type PromotionTypes = Readonly<Record<Color, readonly PieceType[]>>;

/**
 * Promotion choices for an army: every non-royal, non-infantry type in it, without duplicates,
 * in catalog order.
 */
export function promotionTypesFor(types: Iterable<PieceType>): PieceType[] {
  const present = new Set(types);
  return PIECE_TYPES.filter(
    (t) => present.has(t) && !PIECES[t].royal && PIECES[t].family !== 'infantry',
  );
}

/** Promotion choices derived from the pieces currently on the board. */
export function promotionTypesFromBoard(board: Board): PromotionTypes {
  const types: Record<Color, PieceType[]> = { w: [], b: [] };
  for (const p of board) if (p) types[p.color].push(p.type);
  return { w: promotionTypesFor(types.w), b: promotionTypesFor(types.b) };
}

export function findKing(board: Board, color: Color): Square | null {
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p?.color === color && PIECES[p.type].royal) return sq;
  }
  return null;
}

/** Whether `color`'s King is attacked. Always false if that side has no King. */
export function isInCheck(board: Board, color: Color): boolean {
  const king = findKing(board, color);
  return king !== null && isSquareAttacked(board, king, opposite(color));
}

/** Applies a move to `board` in place. Reverse it with {@link unmakeMove}. */
export function makeMove(board: Board, move: Move): void {
  const mover = board[move.from];
  if (!mover) throw new Error('makeMove: no piece on the origin square');
  board[move.to] = move.promotion ? piece(move.promotion, mover.color) : mover;
  board[move.from] = null;
}

/** Reverses {@link makeMove}. `move` must be the move most recently made on `board`. */
export function unmakeMove(board: Board, move: Move): void {
  const moved = board[move.to];
  if (!moved) throw new Error('unmakeMove: no piece on the destination square');
  board[move.from] = piece(move.piece, moved.color);
  board[move.to] = move.captured ? piece(move.captured, opposite(moved.color)) : null;
}

function isPromotionMove(move: Move, color: Color): boolean {
  return PIECES[move.piece].family === 'infantry' && rankOf(move.to) === promotionRank(color);
}

/**
 * All legal moves for the side to move. Infantry reaching the last rank must promote, so each such
 * move appears once per promotion choice; with no choices available it is omitted entirely.
 *
 * `position.board` is modified during generation but restored before returning.
 */
export function generateLegalMoves(position: Position, promotionTypes: PromotionTypes): Move[] {
  const { board, turn } = position;
  const legal: Move[] = [];
  for (const move of pseudoLegalMoves(position)) {
    makeMove(board, move);
    const safe = !isInCheck(board, turn);
    unmakeMove(board, move);
    if (!safe) continue;
    if (isPromotionMove(move, turn)) {
      for (const promotion of promotionTypes[turn]) legal.push({ ...move, promotion });
    } else {
      legal.push(move);
    }
  }
  return legal;
}

/** Counts leaf nodes of the legal move tree to `depth` plies. Used to validate move generation. */
export function perft(position: Position, promotionTypes: PromotionTypes, depth: number): number {
  const moves = generateLegalMoves(position, promotionTypes);
  if (depth <= 1) return depth === 1 ? moves.length : 1;
  const { board, turn } = position;
  const next: Position = { board, turn: opposite(turn) };
  let nodes = 0;
  for (const move of moves) {
    makeMove(board, move);
    nodes += perft(next, promotionTypes, depth - 1);
    unmakeMove(board, move);
  }
  return nodes;
}
