/**
 * Immutable game API for the UI: legal moves, playing moves, game results, draws, undo, and
 * resignation.
 * Every operation returns a new GameState; each state links to the one before it, so undo restores
 * everything (board, clocks, result) exactly.
 */

import { type Color, opposite, promotionRank, rankOf, type Square } from './board';
import { isSquareAttacked, type Move } from './movegen';
import { PIECES, type PieceType } from './pieces';
import { isDeadPosition } from './draws';
import { type Board, formatPosition, type Position } from './position';
import {
  findKing,
  generateLegalMoves,
  isInCheck,
  makeMove,
  type PromotionTypes,
  promotionTypesFromBoard,
} from './rules';

export type DrawReason =
  | 'stalemate'
  | 'dead-position'
  /** Automatic: the same position for the fifth time. */
  | 'fivefold-repetition'
  /** Automatic: 75 moves by each side without a capture or infantry move. */
  | 'seventy-five-move-rule'
  /** Claimed: the same position for the third time. */
  | 'threefold-repetition'
  /** Claimed: 50 moves by each side without a capture or infantry move. */
  | 'fifty-move-rule';

/** Draws a player may claim (rather than ones that end the game automatically). */
export type ClaimableDraw = Extract<DrawReason, 'threefold-repetition' | 'fifty-move-rule'>;

export type GameResult =
  | { readonly kind: 'checkmate'; readonly winner: Color }
  | { readonly kind: 'resignation'; readonly winner: Color }
  | { readonly kind: 'draw'; readonly reason: DrawReason };

export interface GameState {
  readonly position: Position;
  /** Text of the position including side to move; equal keys mean a repeated position. */
  readonly positionKey: string;
  /** Fixed for the whole game: what each side's infantry may promote to. */
  readonly promotionTypes: PromotionTypes;
  /** The move that produced this state; null for the initial state, resignations, and claims. */
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

/** True for states created by resigning or claiming a draw, which repeat the previous position. */
function isEndingAction(state: GameState): boolean {
  return state.lastMove === null && state.previous !== null;
}

/**
 * How many times the current position has occurred, including now. Only positions since the last
 * capture or infantry move are compared, since those moves can never be reversed.
 */
export function repetitionCount(state: GameState): number {
  let count = 0;
  const earliestPly = state.ply - state.halfmoveClock;
  for (let s: GameState | null = state; s && s.ply >= earliestPly; s = s.previous) {
    if (!isEndingAction(s) && s.positionKey === state.positionKey) count++;
  }
  return count;
}

/** Checkmate and stalemate take precedence over the automatic draw rules. */
function resultAfterMove(state: GameState): GameResult | null {
  const { board, turn } = state.position;
  if (movesInPosition(state).length === 0) {
    return isInCheck(board, turn)
      ? { kind: 'checkmate', winner: opposite(turn) }
      : { kind: 'draw', reason: 'stalemate' };
  }
  if (repetitionCount(state) >= 5) return { kind: 'draw', reason: 'fivefold-repetition' };
  if (state.halfmoveClock >= 150) return { kind: 'draw', reason: 'seventy-five-move-rule' };
  if (isDeadPosition(board)) return { kind: 'draw', reason: 'dead-position' };
  return null;
}

export function createGame({ position, promotionTypes }: CreateGameOptions): GameState {
  validatePosition(position);
  const initial: GameState = {
    position: { board: [...position.board], turn: position.turn },
    positionKey: formatPosition(position),
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
  const nextPosition: Position = { board, turn: opposite(state.position.turn) };
  const next: GameState = {
    position: nextPosition,
    positionKey: formatPosition(nextPosition),
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

/** A new state ending the game without a move; undo returns to `state`. */
function endWithoutMove(state: GameState, result: GameResult): GameState {
  return { ...state, lastMove: null, previous: state, result };
}

/** Ends the game with `color` resigning. Undo restores the game to before the resignation. */
export function resign(state: GameState, color: Color): GameState {
  if (state.result) return state;
  return endWithoutMove(state, { kind: 'resignation', winner: opposite(color) });
}

/**
 * The draw the side to move may claim now, if any. A claim is available once the current position
 * has occurred three times, or after 50 moves by each side without a capture or infantry move.
 */
export function claimableDraw(state: GameState): ClaimableDraw | null {
  if (state.result) return null;
  if (repetitionCount(state) >= 3) return 'threefold-repetition';
  if (state.halfmoveClock >= 100) return 'fifty-move-rule';
  return null;
}

/** Ends the game in a claimed draw. Throws if no claim is available. */
export function claimDraw(state: GameState): GameState {
  const reason = claimableDraw(state);
  if (!reason) throw new Error('No draw can be claimed in this position');
  return endWithoutMove(state, { kind: 'draw', reason });
}

/** The state before the last move, resignation, or claim; the initial state is returned unchanged. */
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
