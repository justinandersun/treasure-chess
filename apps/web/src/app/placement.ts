/** Pure helpers for arranging a drafted army on its two starting ranks. */

import {
  type ArmyDraft,
  backRank,
  type Board,
  type Color,
  type Deployment,
  emptyBoard,
  fileOf,
  KING_FILES,
  makeSquare,
  pawnRank,
  PIECE_TYPES,
  PIECES,
  piece,
  type PieceType,
  rankOf,
  type Square,
} from '@treasure-chess/game';

export type Row = 'back' | 'pawn';

export interface Slot {
  readonly row: Row;
  readonly file: number;
}

export function emptyDeployment(): Deployment {
  return { backRank: new Array(8).fill(null), pawnRow: new Array(8).fill(null) };
}

function rowArray(deployment: Deployment, row: Row) {
  return row === 'back' ? deployment.backRank : deployment.pawnRow;
}

export function pieceAtSlot(deployment: Deployment, slot: Slot): PieceType | null {
  return rowArray(deployment, slot.row)[slot.file] ?? null;
}

function withSlot(deployment: Deployment, slot: Slot, type: PieceType | null): Deployment {
  const row = [...rowArray(deployment, slot.row)];
  row[slot.file] = type;
  return slot.row === 'back' ? { ...deployment, backRank: row } : { ...deployment, pawnRow: row };
}

/** Whether `type` may start on `slot`: infantry on the pawn row, the King on the d- or e-file. */
export function canPlace(type: PieceType, slot: Slot): boolean {
  const infantry = PIECES[type].family === 'infantry';
  if (infantry !== (slot.row === 'pawn')) return false;
  return !PIECES[type].royal || KING_FILES.includes(slot.file);
}

/** Drafted pieces not yet on the board. */
export function trayCounts(draft: ArmyDraft, deployment: Deployment): ArmyDraft {
  const tray: Partial<Record<PieceType, number>> = { ...draft };
  for (const type of [...deployment.backRank, ...deployment.pawnRow]) {
    if (type) tray[type] = (tray[type] ?? 0) - 1;
  }
  for (const type of PIECE_TYPES) if (!tray[type] || tray[type] <= 0) delete tray[type];
  return tray;
}

export function trayIsEmpty(draft: ArmyDraft, deployment: Deployment): boolean {
  return Object.keys(trayCounts(draft, deployment)).length === 0;
}

/** Places `type` from the tray; any piece already on the slot returns to the tray. */
export function placeFromTray(deployment: Deployment, type: PieceType, slot: Slot): Deployment {
  if (!canPlace(type, slot)) return deployment;
  return withSlot(deployment, slot, type);
}

/** Moves a placed piece, swapping with any piece on the target if both moves are allowed. */
export function moveWithin(deployment: Deployment, from: Slot, to: Slot): Deployment {
  const moving = pieceAtSlot(deployment, from);
  if (!moving || !canPlace(moving, to)) return deployment;
  const displaced = pieceAtSlot(deployment, to);
  if (displaced && !canPlace(displaced, from)) return deployment;
  return withSlot(withSlot(deployment, from, displaced), to, moving);
}

export function removeAt(deployment: Deployment, slot: Slot): Deployment {
  return withSlot(deployment, slot, null);
}

/**
 * Keeps as many existing placements as the (possibly changed) draft still allows, scanning the
 * back rank then the pawn row from the a-file.
 */
export function reconcileDeployment(draft: ArmyDraft, deployment: Deployment): Deployment {
  const remaining: Partial<Record<PieceType, number>> = { ...draft };
  const keep = (type: PieceType | null) => {
    if (!type || !(remaining[type] ?? 0)) return null;
    remaining[type]! -= 1;
    return type;
  };
  return { backRank: deployment.backRank.map(keep), pawnRow: deployment.pawnRow.map(keep) };
}

export function slotSquare(slot: Slot, color: Color): Square {
  return makeSquare(slot.file, slot.row === 'back' ? backRank(color) : pawnRank(color));
}

/** The slot for a board square, or null if the square is outside `color`'s starting ranks. */
export function squareSlot(sq: Square, color: Color): Slot | null {
  if (rankOf(sq) === backRank(color)) return { row: 'back', file: fileOf(sq) };
  if (rankOf(sq) === pawnRank(color)) return { row: 'pawn', file: fileOf(sq) };
  return null;
}

export function sameSlot(a: Slot | null, b: Slot | null): boolean {
  return !!a && !!b && a.row === b.row && a.file === b.file;
}

/** A board showing only `color`'s deployment. */
export function deploymentBoard(deployment: Deployment, color: Color): Board {
  const board = emptyBoard();
  for (const row of ['back', 'pawn'] as const) {
    rowArray(deployment, row).forEach((type, file) => {
      if (type) board[slotSquare({ row, file }, color)] = piece(type, color);
    });
  }
  return board;
}
