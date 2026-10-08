import {
  attackedSquares,
  emptyBoard,
  makeSquare,
  PIECES,
  piece,
  type PieceType,
  pseudoLegalMovesFrom,
  type Square,
} from '@treasure-chess/game';

/** `both` = moves or captures there; `move` = moves only; `capture` = captures only. */
export type DiagramMark = 'both' | 'move' | 'capture';

/** The diagram shows files a–g and ranks 1–7, so a piece on d4 is centered. */
export const DIAGRAM_SIZE = 7;

/**
 * Where a White piece can go on an empty board: from d4, or from its pawn row (d2) for infantry so
 * the opening double step shows. Computed by the rules engine, so diagrams always match play.
 */
export function movementDiagram(type: PieceType): {
  origin: Square;
  marks: Map<Square, DiagramMark>;
} {
  const infantry = PIECES[type].family === 'infantry';
  const origin = makeSquare(3, infantry ? 1 : 3);
  const board = emptyBoard();
  board[origin] = piece(type, 'w');
  const marks = new Map<Square, DiagramMark>();
  for (const m of pseudoLegalMovesFrom(board, origin)) marks.set(m.to, infantry ? 'move' : 'both');
  if (infantry) {
    for (const sq of attackedSquares(board, origin)) {
      marks.set(sq, marks.has(sq) ? 'both' : 'capture');
    }
  }
  return { origin, marks };
}
