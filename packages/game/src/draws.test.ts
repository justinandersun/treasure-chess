import { describe, expect, it } from 'vitest';
import { fileOf, parseSquare, rankOf } from './board';
import { CANNOT_MATE_ALONE, isColorBound, isDeadPosition } from './draws';
import { createGame, playMove } from './game';
import { PIECE_TYPES, PIECES, piece, type PieceType } from './pieces';
import { emptyBoard, parsePosition, type Position } from './position';
import { generateLegalMoves, isInCheck } from './rules';

const OFFICERS = PIECE_TYPES.filter((t) => !PIECES[t].royal && PIECES[t].family !== 'infantry');

/** Whether any position with White King + `type` vs lone Black King is checkmate. */
function checkmateExists(type: PieceType): boolean {
  const board = emptyBoard();
  const position: Position = { board, turn: 'b' };
  const noPromotions = { w: [], b: [] };
  for (let bk = 0; bk < 64; bk++) {
    for (let wk = 0; wk < 64; wk++) {
      if (Math.abs(fileOf(bk) - fileOf(wk)) <= 1 && Math.abs(rankOf(bk) - rankOf(wk)) <= 1) {
        continue; // Kings may not be adjacent (this also excludes wk === bk).
      }
      for (let x = 0; x < 64; x++) {
        if (x === bk || x === wk) continue;
        board.fill(null);
        board[bk] = piece('king', 'b');
        board[wk] = piece('king', 'w');
        board[x] = piece(type, 'w');
        if (isInCheck(board, 'b') && generateLegalMoves(position, noPromotions).length === 0) {
          return true;
        }
      }
    }
  }
  return false;
}

describe('CANNOT_MATE_ALONE', () => {
  it('is exactly the set of pieces with no King + piece vs King checkmate (exhaustive)', () => {
    const cannotMate = OFFICERS.filter((t) => !checkmateExists(t));
    expect(new Set(cannotMate)).toEqual(CANNOT_MATE_ALONE);
  });
});

describe('isColorBound', () => {
  it('is true exactly for Priest, Bishop, and Camel', () => {
    expect(PIECE_TYPES.filter(isColorBound)).toEqual(['priest', 'bishop', 'camel']);
  });
});

describe('isDeadPosition', () => {
  const dead = (fen: string) => isDeadPosition(parsePosition(fen).board);

  it('King vs King', () => {
    expect(dead('k7/8/8/8/8/8/8/7K w')).toBe(true);
  });

  it('King + a piece that cannot mate alone vs King', () => {
    expect(dead('k7/8/8/8/8/8/8/6NK w')).toBe(true);
    expect(dead('k7/8/8/8/8/8/8/6MK w')).toBe(true);
    expect(dead('k7/8/8/8/3i4/8/8/7K w')).toBe(true);
    expect(dead('k7/8/8/8/8/8/8/6CK w')).toBe(true);
  });

  it('King + a piece that can mate vs King is not dead', () => {
    for (const symbol of ['R', 'Q', 'T', 'Y', 'E', 'O', 'F']) {
      expect(dead(`k7/8/8/8/8/8/8/6${symbol}K w`)).toBe(false);
    }
  });

  it('color-bound pieces all on one square color, any number and either side', () => {
    // c1, f4, and d6 are all dark squares.
    expect(dead('k7/8/3b4/8/5M2/8/8/2B4K w')).toBe(true);
    expect(dead('k7/8/8/8/8/8/8/2B2b1K w')).toBe(false); // c1 dark, f1 light
  });

  it('is never declared with infantry on the board', () => {
    expect(dead('k7/8/8/8/8/8/P7/7K w')).toBe(false);
    expect(dead('k7/s7/8/8/8/8/8/7K w')).toBe(false);
  });

  it('is conservative for uncertain material', () => {
    expect(dead('k7/8/8/8/8/8/8/5NNK w')).toBe(false);
    expect(dead('kn6/8/8/8/8/8/8/6NK w')).toBe(false);
  });

  it('ends the game automatically when a capture leaves dead material', () => {
    const state = createGame({ position: parsePosition('k7/8/8/8/8/8/1r6/KN6 w') });
    const after = playMove(state, { from: parseSquare('a1'), to: parseSquare('b2') });
    expect(after.result).toEqual({ kind: 'draw', reason: 'dead-position' });
  });
});
