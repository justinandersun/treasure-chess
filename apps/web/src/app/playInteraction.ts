/**
 * What a tap on the board means during play. Kept free of React so it can be unit-tested.
 *
 * - Tap one of your pieces to select it and see its legal moves; tap it again to clear.
 * - Tap a highlighted destination to move (choosing a piece first if the move promotes).
 * - Tap an opponent's piece (or any piece once the game is over) to inspect it: its moves,
 *   captures, and the squares it attacks are shown, but nothing can be played.
 */

import {
  attackedSquares,
  type GameState,
  legalMovesFrom,
  type MoveInput,
  type PieceType,
  pseudoLegalMovesFrom,
  type Square,
} from '@treasure-chess/game';

export interface Selection {
  readonly square: Square;
  readonly mode: 'move' | 'inspect';
}

export type TapResult =
  | { readonly kind: 'select'; readonly selection: Selection | null }
  | { readonly kind: 'move'; readonly move: MoveInput }
  | {
      readonly kind: 'promote';
      readonly from: Square;
      readonly to: Square;
      readonly choices: readonly PieceType[];
    };

export function handleTap(game: GameState, selection: Selection | null, sq: Square): TapResult {
  if (selection?.mode === 'move') {
    const moves = legalMovesFrom(game, selection.square).filter((m) => m.to === sq);
    const choices = moves.flatMap((m) => (m.promotion ? [m.promotion] : []));
    if (choices.length > 0) return { kind: 'promote', from: selection.square, to: sq, choices };
    if (moves[0]) return { kind: 'move', move: { from: moves[0].from, to: moves[0].to } };
  }

  const piece = game.position.board[sq];
  if (!piece || sq === selection?.square) return { kind: 'select', selection: null };
  const canMove = !game.result && piece.color === game.position.turn;
  return { kind: 'select', selection: { square: sq, mode: canMove ? 'move' : 'inspect' } };
}

/** `attack` marks squares an inspected piece attacks but could not move to right now. */
export type MarkKind = 'move' | 'capture' | 'attack';

export function selectionMarks(
  game: GameState,
  selection: Selection | null,
): Map<Square, MarkKind> {
  const marks = new Map<Square, MarkKind>();
  if (!selection) return marks;
  if (selection.mode === 'move') {
    for (const m of legalMovesFrom(game, selection.square)) {
      marks.set(m.to, m.captured ? 'capture' : 'move');
    }
    return marks;
  }
  const { board } = game.position;
  for (const m of pseudoLegalMovesFrom(board, selection.square)) {
    marks.set(m.to, m.captured ? 'capture' : 'move');
  }
  for (const sq of attackedSquares(board, selection.square)) {
    if (!marks.has(sq)) marks.set(sq, 'attack');
  }
  return marks;
}
