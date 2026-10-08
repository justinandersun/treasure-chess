/**
 * Pseudo-legal move generation and attack detection, driven by the movement data in the catalog.
 * "Pseudo-legal" means piece movement rules are obeyed but King safety is not yet checked.
 */

import {
  type Color,
  fileOf,
  forward,
  isOnBoard,
  makeSquare,
  NO_SQUARE,
  offsetSquare,
  pawnRank,
  rankOf,
  type Square,
} from './board';
import { type MoveComponent, type Piece, PIECES, type PieceType } from './pieces';
import type { Board, Position } from './position';

export interface Move {
  readonly from: Square;
  readonly to: Square;
  readonly piece: PieceType;
  /** Type of the enemy piece on `to`, if this move captures. */
  readonly captured?: PieceType;
  /** Piece type an infantry piece becomes on reaching the last rank. Set only on legal moves. */
  readonly promotion?: PieceType;
}

/** Called for each reachable square; return `true` to stop the scan early. */
type Visitor = (to: Square, occupant: Piece | null) => boolean | void;

/** Visits squares along a ray up to and including the first occupied square. */
function scanRay(board: Board, from: Square, df: number, dr: number, visit: Visitor): boolean {
  let file = fileOf(from) + df;
  let rank = rankOf(from) + dr;
  while (isOnBoard(file, rank)) {
    const to = makeSquare(file, rank);
    const occupant = board[to] ?? null;
    if (visit(to, occupant)) return true;
    if (occupant) return false;
    file += df;
    rank += dr;
  }
  return false;
}

/**
 * Visits every square a non-infantry component reaches, regardless of who occupies it.
 * For infantry, visits only the capture squares (what the piece attacks).
 */
function scanComponent(
  board: Board,
  from: Square,
  color: Color,
  component: MoveComponent,
  visit: Visitor,
): boolean {
  switch (component.kind) {
    case 'leap':
      for (const [df, dr] of component.offsets) {
        const to = offsetSquare(from, df, dr);
        if (to !== NO_SQUARE && visit(to, board[to] ?? null)) return true;
      }
      return false;
    case 'slide':
      for (const [df, dr] of component.directions) {
        if (scanRay(board, from, df, dr, visit)) return true;
      }
      return false;
    case 'bent':
      for (const { step, slides } of component.paths) {
        const turn = offsetSquare(from, step[0], step[1]);
        if (turn === NO_SQUARE) continue;
        const occupant = board[turn] ?? null;
        if (visit(turn, occupant)) return true;
        if (occupant) continue;
        for (const [df, dr] of slides) {
          if (scanRay(board, turn, df, dr, visit)) return true;
        }
      }
      return false;
    case 'infantry': {
      const fwd = forward(color);
      for (const [df, dr] of component.captures) {
        const to = offsetSquare(from, df, dr * fwd);
        if (to !== NO_SQUARE && visit(to, board[to] ?? null)) return true;
      }
      return false;
    }
  }
}

function scanAttacks(board: Board, from: Square, p: Piece, visit: Visitor): boolean {
  for (const component of PIECES[p.type].movement) {
    if (scanComponent(board, from, p.color, component, visit)) return true;
  }
  return false;
}

function pushMove(moves: Move[], from: Square, to: Square, type: PieceType, captured?: Piece) {
  moves.push(
    captured ? { from, to, piece: type, captured: captured.type } : { from, to, piece: type },
  );
}

function infantryMoves(
  board: Board,
  from: Square,
  p: Piece,
  component: Extract<MoveComponent, { kind: 'infantry' }>,
  moves: Move[],
) {
  const fwd = forward(p.color);
  for (const [df, dr] of component.moves) {
    const to = offsetSquare(from, df, dr * fwd);
    if (to !== NO_SQUARE && !board[to]) pushMove(moves, from, to, p.type);
  }
  for (const [df, dr] of component.captures) {
    const to = offsetSquare(from, df, dr * fwd);
    const target = to === NO_SQUARE ? null : board[to];
    if (target && target.color !== p.color) pushMove(moves, from, to, p.type, target);
  }
  if (rankOf(from) !== pawnRank(p.color)) return;
  for (const [df, dr] of component.doubleMoves) {
    const mid = offsetSquare(from, df, dr * fwd);
    const to = offsetSquare(from, 2 * df, 2 * dr * fwd);
    if (mid !== NO_SQUARE && to !== NO_SQUARE && !board[mid] && !board[to]) {
      pushMove(moves, from, to, p.type);
    }
  }
}

/** Pseudo-legal moves for the piece on `from` (empty if the square is empty). */
export function pseudoLegalMovesFrom(board: Board, from: Square): Move[] {
  const p = board[from];
  if (!p) return [];
  const moves: Move[] = [];
  for (const component of PIECES[p.type].movement) {
    if (component.kind === 'infantry') {
      infantryMoves(board, from, p, component, moves);
      continue;
    }
    scanComponent(board, from, p.color, component, (to, occupant) => {
      if (!occupant) pushMove(moves, from, to, p.type);
      else if (occupant.color !== p.color) pushMove(moves, from, to, p.type, occupant);
    });
  }
  return moves;
}

/** Pseudo-legal moves for every piece of the side to move. */
export function pseudoLegalMoves(position: Position): Move[] {
  const moves: Move[] = [];
  position.board.forEach((p, sq) => {
    if (p?.color === position.turn) moves.push(...pseudoLegalMovesFrom(position.board, sq));
  });
  return moves;
}

/**
 * Squares the piece on `from` attacks: where it could capture an enemy piece. Includes squares
 * occupied by its own pieces (it defends them). For infantry this is the capture pattern only.
 */
export function attackedSquares(board: Board, from: Square): Square[] {
  const p = board[from];
  if (!p) return [];
  const squares = new Set<Square>();
  scanAttacks(board, from, p, (to) => {
    squares.add(to);
  });
  return [...squares];
}

/** Whether any piece of color `by` attacks `target`. */
export function isSquareAttacked(board: Board, target: Square, by: Color): boolean {
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p?.color === by && scanAttacks(board, sq, p, (to) => to === target)) return true;
  }
  return false;
}
