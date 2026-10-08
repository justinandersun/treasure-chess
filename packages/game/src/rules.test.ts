import { describe, expect, it } from 'vitest';
import { formatPosition, parsePosition } from './position';
import {
  generateLegalMoves,
  makeMove,
  perft,
  promotionTypesFor,
  promotionTypesFromBoard,
  unmakeMove,
} from './rules';
import type { PromotionTypes } from './rules';

const STANDARD: PromotionTypes = {
  w: ['rook', 'bishop', 'knight', 'queen'],
  b: ['rook', 'bishop', 'knight', 'queen'],
};

/**
 * Published perft counts for orthodox chess (chessprogramming.org). With the standard army, our
 * rules differ only by lacking castling and en passant, so positions and depths are chosen where
 * neither can occur — or adjusted for the en passant moves that the published count includes.
 */
describe('perft against orthodox chess', () => {
  it('start position, depths 1–4', () => {
    const pos = parsePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
    expect(perft(pos, STANDARD, 1)).toBe(20);
    expect(perft(pos, STANDARD, 2)).toBe(400);
    expect(perft(pos, STANDARD, 3)).toBe(8902);
    expect(perft(pos, STANDARD, 4)).toBe(197281);
  });

  it('"Position 3" (pins, checks, no castling)', () => {
    const pos = parsePosition('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w');
    expect(perft(pos, STANDARD, 1)).toBe(14);
    expect(perft(pos, STANDARD, 2)).toBe(191);
    // Published 2812 includes 2 en passant captures, which Treasure Chess does not allow.
    expect(perft(pos, STANDARD, 3)).toBe(2810);
  });

  it('promotion-heavy position (incl. underpromotion)', () => {
    const pos = parsePosition('n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b');
    expect(perft(pos, STANDARD, 1)).toBe(24);
    expect(perft(pos, STANDARD, 2)).toBe(496);
    expect(perft(pos, STANDARD, 3)).toBe(9483);
  });
});

describe('make/unmake', () => {
  it('restores the board exactly, including captures and promotions', () => {
    const pos = parsePosition('n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b');
    const before = formatPosition(pos);
    for (const move of generateLegalMoves(pos, STANDARD)) {
      makeMove(pos.board, move);
      unmakeMove(pos.board, move);
      expect(formatPosition(pos)).toBe(before);
    }
  });

  it('generateLegalMoves leaves the board unchanged', () => {
    const pos = parsePosition('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w');
    const before = formatPosition(pos);
    generateLegalMoves(pos, STANDARD);
    expect(formatPosition(pos)).toBe(before);
  });
});

describe('promotionTypesFor', () => {
  it('keeps non-royal, non-infantry types once each, in catalog order', () => {
    expect(
      promotionTypesFor([
        'king',
        'pawn',
        'scout',
        'queen',
        'camel',
        'camel',
        'gryphon',
        'sergeant',
      ]),
    ).toEqual(['gryphon', 'camel', 'queen']);
  });
});

/** Flips ranks, swaps colors, and swaps the side to move. */
function mirrorPosition(fen: string): string {
  const [placement, turn] = fen.split(' ');
  const swapCase = (ch: string) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase());
  const rows = placement!
    .split('/')
    .reverse()
    .map((row) => [...row].map(swapCase).join(''));
  return `${rows.join('/')} ${turn === 'w' ? 'b' : 'w'}`;
}

/**
 * Regression counts for fairy armies. There are no published references for these pieces, so the
 * counts are pinned from this implementation (depth 1 of the first was verified by hand: 26 infantry
 * moves + 12 back-rank moves) and cross-checked by color symmetry.
 */
describe('perft regression (fairy armies)', () => {
  const CASES: [fen: string, counts: number[]][] = [
    ['ry1okqn1/gspsgpsp/8/8/8/8/PSGPPGSP/TMICKFYE w', [38, 1102, 41378]],
    ['k1r5/1S1Y4/8/3c4/8/2F5/1g3E2/4K3 w', [46, 1437, 55942]],
  ];

  for (const [fen, counts] of CASES) {
    it(fen, () => {
      const pos = parsePosition(fen);
      const types = promotionTypesFromBoard(pos.board);
      counts.forEach((n, i) => expect(perft(pos, types, i + 1)).toBe(n));
    });

    it(`${fen} (color-mirrored)`, () => {
      const pos = parsePosition(mirrorPosition(fen));
      const types = promotionTypesFromBoard(pos.board);
      counts.forEach((n, i) => expect(perft(pos, types, i + 1)).toBe(n));
    });
  }
});
