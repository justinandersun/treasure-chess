/**
 * Immutable game API for the UI: legal moves, playing moves, game results, undo, and resignation.
 * Every operation returns a new GameState; each state links to the one before it, so undo restores
 * everything (board, clocks, result) exactly.
 */

import { type Color, opposite, promotionRank, rankOf, type Square } from './board';
import { isSquareAttacked, type Move } from './movegen';
import { PIECES, type PieceType } from './pieces';
import type { Board, Position } from './position';
import {
  findKing,
  generateLegalMoves,
  isInCheck,
  makeMove,
  type PromotionTypes,
  promotionTypesFromBoard,
} from './rules';

export type GameResult =
  | { readonly kind: 'checkmate'; readonly winner: Color }
  | { readonly kind: 'stalemate' }
  | { readonly kind: 'resignation'; readonly winner: Color };

export interface GameState {
  readonly position: Position;
  /** Fixed for the whole game: what each side's infantry may promote to. */
  readonly promotionTypes: PromotionTypes;
  /** The move that produced this state, or null for the initial state and resignations. */
  readonly lastMove: Move | null;
  readonly previous: GameState | null;
  /** Half-moves played since the start. */
  readonly ply: number;
  /** Half-moves since the last capture or infantry move (for the 50- and 75-move rules). */
  readonly halfmoveClock: number;
  /** Set once the game has ended; no further moves are legal. */
  readonly result: GameResult | null;
}

/** Identifies a move from the UI. `promotion` is required when the move promotes. */
export interface MoveInput {
  readonly from: Square;
  readonly to: Square;
  readonly promotion?: PieceType;
}

export class IllegalMoveError extends Error {
  constructor(input: MoveInput) {
    super(`Illegal move: ${JSON.stringify(input)}`);
    this.name = 'IllegalMoveError';
  }
}

export interface CreateGameOptions {
  readonly position: Position;
  /** Defaults to the non-royal, non-infantry types each side has on the board. */
  readonly promotionTypes?: PromotionTypes;
}

/** Throws if the position could not arise in play. */
function validatePosition({ board, turn }: Position): void {
  for (const color of ['w', 'b'] as const) {
    const kings = board.filter((p) => p?.color === color && PIECES[p.type].royal).length;
    if (kings > 1) throw new Error(`${color} has more than one King`);
  }
  board.forEach((p, sq) => {
    if (p && PIECES[p.type].family === 'infantry') {
      const rank = rankOf(sq);
      if (rank === promotionRank(p.color) || rank === promotionRank(opposite(p.color))) {
        throw new Error('Infantry cannot stand on either back rank');
      }
    }
  });
  const waiting = findKing(board, opposite(turn));
  if (waiting !== null && isSquareAttacked(board, waiting, turn)) {
    throw new Error('The side not to move is in check');
  }
}

const legalMoveCache = new WeakMap<GameState, readonly Move[]>();

function computeLegalMoves(state: GameState): readonly Move[] {
  // generateLegalMoves restores the board, but work on a copy so states stay strictly immutable.
  const position = { board: [...state.position.board], turn: state.position.turn };
  return generateLegalMoves(position, state.promotionTypes);
}

/** Legal moves ignoring whether the game has ended (used to detect the end). */
function movesInPosition(state: GameState): readonly Move[] {
  let moves = legalMoveCache.get(state);
  if (!moves) {
    moves = computeLegalMoves(state);
    legalMoveCache.set(state, moves);
  }
  return moves;
}

function resultAfterMove(state: GameState): GameResult | null {
  if (movesInPosition(state).length > 0) return null;
  const { board, turn } = state.position;
  return isInCheck(board, turn)
    ? { kind: 'checkmate', winner: opposite(turn) }
    : { kind: 'stalemate' };
}

export function createGame({ position, promotionTypes }: CreateGameOptions): GameState {
  validatePosition(position);
  const initial: GameState = {
    position: { board: [...position.board], turn: position.turn },
    promotionTypes: promotionTypes ?? promotionTypesFromBoard(position.board),
    lastMove: null,
    previous: null,
    ply: 0,
    halfmoveClock: 0,
    result: null,
  };
  const result = resultAfterMove(initial);
  return result ? { ...initial, result } : initial;
}

/** All legal moves for the side to move; empty once the game has ended. */
export function legalMoves(state: GameState): readonly Move[] {
  return state.result ? [] : movesInPosition(state);
}

export function legalMovesFrom(state: GameState, from: Square): Move[] {
  return legalMoves(state).filter((m) => m.from === from);
}

/** Whether moving from → to requires choosing a promotion piece. */
export function isPromotion(state: GameState, from: Square, to: Square): boolean {
  return legalMoves(state).some((m) => m.from === from && m.to === to && m.promotion);
}

export function findLegalMove(state: GameState, input: MoveInput): Move | undefined {
  return legalMoves(state).find(
    (m) => m.from === input.from && m.to === input.to && m.promotion === input.promotion,
  );
}

/** Plays a legal move. Throws {@link IllegalMoveError} otherwise; `state` is never modified. */
export function playMove(state: GameState, input: MoveInput): GameState {
  const move = findLegalMove(state, input);
  if (!move) throw new IllegalMoveError(input);

  const board: Board = [...state.position.board];
  makeMove(board, move);
  const resetsClock = move.captured !== undefined || PIECES[move.piece].family === 'infantry';
  const next: GameState = {
    position: { board, turn: opposite(state.position.turn) },
    promotionTypes: state.promotionTypes,
    lastMove: move,
    previous: state,
    ply: state.ply + 1,
    halfmoveClock: resetsClock ? 0 : state.halfmoveClock + 1,
    result: null,
  };
  const result = resultAfterMove(next);
  return result ? { ...next, result } : next;
}

/** Ends the game with `color` resigning. Undo restores the game to before the resignation. */
export function resign(state: GameState, color: Color): GameState {
  if (state.result) return state;
  return {
    ...state,
    lastMove: null,
    previous: state,
    result: { kind: 'resignation', winner: opposite(color) },
  };
}

/** The state before the last move or resignation; the initial state is returned unchanged. */
export function undo(state: GameState): GameState {
  return state.previous ?? state;
}

/** Moves played from the start of the game, in order. */
export function moveHistory(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let s: GameState | null = state; s; s = s.previous) {
    if (s.lastMove) moves.push(s.lastMove);
  }
  return moves.reverse();
}

/** Whether the side to move is in check. */
export function inCheck(state: GameState): boolean {
  return isInCheck(state.position.board, state.position.turn);
}
