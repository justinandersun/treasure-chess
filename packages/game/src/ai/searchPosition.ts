/**
 * A mutable position for search: make/unmake with incremental Zobrist hashing, cached King
 * squares, and a history of hashes for repetition detection.
 */

import { type Color, opposite, promotionRank, rankOf, type Square } from '../board';
import { isSquareAttacked, type Move, pseudoLegalMovesFrom } from '../movegen';
import { PIECES, piece } from '../pieces';
import type { Board, Position } from '../position';
import { findKing, type PromotionTypes } from '../rules';
import { hashPosition, keyHi, keyLo, SIDE_HI, SIDE_LO } from '../zobrist';

interface Undo {
  readonly lo: number;
  readonly hi: number;
  readonly clock: number;
  readonly king: Square | null;
}

export class SearchPosition {
  readonly board: Board;
  turn: Color;
  lo: number;
  hi: number;
  /** Half-moves since the last capture or infantry move. */
  clock: number;
  private readonly kings: Record<Color, Square | null>;
  private readonly undos: Undo[] = [];
  /** Hashes of earlier positions, oldest first (the current position is not included). */
  private readonly history: { lo: number; hi: number }[];

  constructor(
    position: Position,
    readonly promotionTypes: PromotionTypes,
    history: readonly { lo: number; hi: number }[] = [],
    clock = 0,
  ) {
    this.board = [...position.board];
    this.turn = position.turn;
    ({ lo: this.lo, hi: this.hi } = hashPosition(this.board, this.turn));
    this.kings = { w: findKing(this.board, 'w'), b: findKing(this.board, 'b') };
    this.history = [...history];
    this.clock = clock;
  }

  make(move: Move): void {
    const { board } = this;
    const mover = board[move.from]!;
    const placed = move.promotion ? piece(move.promotion, mover.color) : mover;
    this.undos.push({ lo: this.lo, hi: this.hi, clock: this.clock, king: this.kings[mover.color] });
    this.history.push({ lo: this.lo, hi: this.hi });

    let lo = this.lo ^ keyLo(mover, move.from) ^ keyLo(placed, move.to) ^ SIDE_LO;
    let hi = this.hi ^ keyHi(mover, move.from) ^ keyHi(placed, move.to) ^ SIDE_HI;
    const captured = board[move.to];
    if (captured) {
      lo ^= keyLo(captured, move.to);
      hi ^= keyHi(captured, move.to);
    }
    this.lo = lo >>> 0;
    this.hi = hi >>> 0;

    board[move.to] = placed;
    board[move.from] = null;
    if (PIECES[mover.type].royal) this.kings[mover.color] = move.to;
    this.clock = captured || PIECES[mover.type].family === 'infantry' ? 0 : this.clock + 1;
    this.turn = opposite(this.turn);
  }

  unmake(move: Move): void {
    const undo = this.undos.pop()!;
    this.history.pop();
    this.turn = opposite(this.turn);
    const moved = this.board[move.to]!;
    this.board[move.from] = piece(move.piece, moved.color);
    this.board[move.to] = move.captured ? piece(move.captured, opposite(moved.color)) : null;
    this.kings[moved.color] = undo.king;
    this.lo = undo.lo;
    this.hi = undo.hi;
    this.clock = undo.clock;
  }

  /** Whether `color`'s King is attacked (false if it has none). */
  inCheck(color: Color = this.turn): boolean {
    const king = this.kings[color];
    return king !== null && isSquareAttacked(this.board, king, opposite(color));
  }

  /** Whether the current position occurred before, with the same side to move. */
  isRepetition(): boolean {
    const { history } = this;
    const earliest = Math.max(0, history.length - this.clock);
    for (let i = history.length - 2; i >= earliest; i -= 2) {
      const h = history[i]!;
      if (h.lo === this.lo && h.hi === this.hi) return true;
    }
    return false;
  }

  /**
   * Pseudo-legal moves for the side to move (King safety is checked by the caller after `make`).
   * Moves to the last rank by infantry are expanded into one move per promotion choice.
   */
  moves(capturesOnly = false): Move[] {
    const { board, turn } = this;
    const lastRank = promotionRank(turn);
    const out: Move[] = [];
    for (let sq = 0; sq < 64; sq++) {
      if (board[sq]?.color !== turn) continue;
      for (const m of pseudoLegalMovesFrom(board, sq)) {
        const promotes = PIECES[m.piece].family === 'infantry' && rankOf(m.to) === lastRank;
        if (promotes) {
          for (const promotion of this.promotionTypes[turn]) out.push({ ...m, promotion });
        } else if (!capturesOnly || m.captured) {
          out.push(m);
        }
      }
    }
    return out;
  }
}
