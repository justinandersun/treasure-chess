import { type ArmyDraft, parseDeployment, parseSquare } from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import {
  canPlace,
  deploymentBoard,
  emptyDeployment,
  moveWithin,
  placeFromTray,
  reconcileDeployment,
  removeAt,
  squareSlot,
  slotSquare,
  trayCounts,
  trayIsEmpty,
} from './placement';

const DRAFT: ArmyDraft = { king: 1, knight: 2, pawn: 6, scout: 2 };

describe('placement', () => {
  it('enforces rows and King files', () => {
    expect(canPlace('pawn', { row: 'pawn', file: 0 })).toBe(true);
    expect(canPlace('pawn', { row: 'back', file: 0 })).toBe(false);
    expect(canPlace('knight', { row: 'pawn', file: 0 })).toBe(false);
    expect(canPlace('king', { row: 'back', file: 3 })).toBe(true);
    expect(canPlace('king', { row: 'back', file: 4 })).toBe(true);
    expect(canPlace('king', { row: 'back', file: 5 })).toBe(false);
  });

  it('tracks the tray as the draft minus placed pieces', () => {
    let d = placeFromTray(emptyDeployment(), 'knight', { row: 'back', file: 1 });
    d = placeFromTray(d, 'king', { row: 'back', file: 4 });
    expect(trayCounts(DRAFT, d)).toEqual({ knight: 1, pawn: 6, scout: 2 });
    expect(trayIsEmpty(DRAFT, d)).toBe(false);
  });

  it('ignores placements on the wrong row', () => {
    const d = emptyDeployment();
    expect(placeFromTray(d, 'knight', { row: 'pawn', file: 1 })).toBe(d);
  });

  it('placing onto an occupied slot returns the old piece to the tray', () => {
    const withKnight = placeFromTray(emptyDeployment(), 'knight', { row: 'back', file: 1 });
    expect(placeFromTray(withKnight, 'king', { row: 'back', file: 1 })).toBe(withKnight);
    let d = placeFromTray(withKnight, 'pawn', { row: 'pawn', file: 0 });
    d = placeFromTray(d, 'scout', { row: 'pawn', file: 0 });
    expect(trayCounts(DRAFT, d)).toEqual({ king: 1, knight: 1, pawn: 6, scout: 1 });
  });

  it('moves and swaps placed pieces only when both fit', () => {
    const d = parseDeployment('.N..K...', 'PSPPPPSP');
    expect(moveWithin(d, { row: 'back', file: 1 }, { row: 'back', file: 4 })).toBe(d); // King to b1
    const swapped = moveWithin(d, { row: 'back', file: 4 }, { row: 'back', file: 3 });
    expect(swapped.backRank.join(',')).toBe(',knight,,king,,,,');
    const pawns = moveWithin(d, { row: 'pawn', file: 0 }, { row: 'pawn', file: 1 });
    expect(pawns.pawnRow.slice(0, 2)).toEqual(['scout', 'pawn']);
    expect(moveWithin(d, { row: 'pawn', file: 0 }, { row: 'back', file: 0 })).toBe(d);
    expect(removeAt(d, { row: 'back', file: 1 }).backRank[1]).toBeNull();
  });

  it('reconciles placements with a changed draft', () => {
    const placed = parseDeployment('.NN.K...', 'PSPPPPSP');
    const reconciled = reconcileDeployment({ king: 1, knight: 1, pawn: 8 }, placed);
    expect(reconciled.backRank.join(',')).toBe(',knight,,,king,,,');
    expect(reconciled.pawnRow.filter(Boolean)).toEqual(new Array(6).fill('pawn'));
  });

  it('maps slots to squares for each color', () => {
    expect(slotSquare({ row: 'back', file: 4 }, 'w')).toBe(parseSquare('e1'));
    expect(slotSquare({ row: 'pawn', file: 4 }, 'b')).toBe(parseSquare('e7'));
    expect(squareSlot(parseSquare('c8'), 'b')).toEqual({ row: 'back', file: 2 });
    expect(squareSlot(parseSquare('c8'), 'w')).toBeNull();
    const board = deploymentBoard(parseDeployment('....K...', '........'), 'b');
    expect(board[parseSquare('e8')]).toEqual({ type: 'king', color: 'b' });
  });
});
