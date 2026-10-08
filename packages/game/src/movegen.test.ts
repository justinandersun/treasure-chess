import { describe, expect, it } from 'vitest';
import { parseSquare } from './board';
import { isSquareAttacked } from './movegen';
import { parsePosition } from './position';
import { attacks, captures, destinations, lonePiece, squares } from './testing';
import type { PieceType } from './pieces';

/**
 * Expected destinations on an otherwise empty board, worked out by hand from the spec.
 * Infantry are covered separately because their moves depend on rank and occupancy.
 */
const EMPTY_BOARD: Record<Exclude<PieceType, 'pawn' | 'scout' | 'sergeant'>, [string, string]> = {
  // [from d4, from a1]
  bastion: ['b4 c4 e4 f4 d2 d3 d5 d6', 'a2 a3 b1 c1'],
  rook: ['a4 b4 c4 e4 f4 g4 h4 d1 d2 d3 d5 d6 d7 d8', 'a2 a3 a4 a5 a6 a7 a8 b1 c1 d1 e1 f1 g1 h1'],
  gryphon: [
    'c3 c5 e3 e5 f5 g5 h5 e6 e7 e8 b5 a5 c6 c7 c8 f3 g3 h3 e2 e1 b3 a3 c2 c1',
    'b2 c2 d2 e2 f2 g2 h2 b3 b4 b5 b6 b7 b8',
  ],
  priest: ['c3 c5 e3 e5 b2 b6 f2 f6', 'b2 c3'],
  bishop: ['a1 b2 c3 e5 f6 g7 h8 a7 b6 c5 e3 f2 g1', 'b2 c3 d4 e5 f6 g7 h8'],
  cardinal: [
    'd5 d3 c4 e4 e6 f7 g8 c6 b7 a8 e2 f1 c2 b1 f5 g6 h7 f3 g2 h1 b5 a6 b3 a2',
    'a2 b1 b3 c4 d5 e6 f7 g8 c2 d3 e4 f5 g6 h7',
  ],
  camel: ['c1 c7 e1 e7 a3 a5 g3 g5', 'b4 d2'],
  knight: ['b3 b5 c2 c6 e2 e6 f3 f5', 'b3 c2'],
  elephant: ['b3 b5 c2 c6 e2 e6 f3 f5 c1 c7 e1 e7 a3 a5 g3 g5', 'b3 c2 b4 d2'],
  consort: ['c3 c4 c5 d3 d5 e3 e4 e5', 'a2 b1 b2'],
  falconer: ['d2 d6 b4 f4 b3 b5 c2 c6 e2 e6 f3 f5 b2 b6 f2 f6', 'a3 c1 b3 c2 c3'],
  queen: [
    'a4 b4 c4 e4 f4 g4 h4 d1 d2 d3 d5 d6 d7 d8 a1 b2 c3 e5 f6 g7 h8 a7 b6 c5 e3 f2 g1',
    'a2 a3 a4 a5 a6 a7 a8 b1 c1 d1 e1 f1 g1 h1 b2 c3 d4 e5 f6 g7 h8',
  ],
  king: ['c3 c4 c5 d3 d5 e3 e4 e5', 'a2 b1 b2'],
};

describe('empty-board destinations', () => {
  for (const [type, [fromD4, fromA1]] of Object.entries(EMPTY_BOARD)) {
    it(`${type} from d4 and a1`, () => {
      const t = type as PieceType;
      expect(destinations(lonePiece(t, 'd4'), 'd4')).toEqual(squares(fromD4));
      expect(destinations(lonePiece(t, 'a1'), 'a1')).toEqual(squares(fromA1));
    });
  }
});

describe('leapers', () => {
  it('jump over pieces of either color', () => {
    // Bastion d4 surrounded by blockers on d5/c4/e4/d3 still reaches the two-step squares.
    const fen = '8/8/8/3p4/2pTP3/3P4/8/8 w';
    expect(destinations(fen, 'd4')).toEqual(squares('d5 c4 b4 f4 d2 d6'));
  });

  it('cannot land on friendly pieces but can capture enemies', () => {
    const fen = '8/8/2n1N3/8/3N4/8/8/8 w';
    expect(destinations(fen, 'd4')).toEqual(squares('b3 b5 c2 c6 e2 f3 f5'));
    expect(captures(fen, 'd4')).toEqual(['c6']);
  });

  it('Priest jumps diagonally over a blocker', () => {
    const fen = '8/8/8/4P3/3I4/8/8/8 w';
    expect(destinations(fen, 'd4')).toEqual(squares('c3 c5 e3 b2 b6 f2 f6'));
  });

  it('Falconer never moves to adjacent squares', () => {
    const fen = lonePiece('falconer', 'd4');
    for (const sq of squares('c3 c4 c5 d3 d5 e3 e4 e5')) {
      expect(destinations(fen, 'd4')).not.toContain(sq);
    }
  });
});

describe('sliders', () => {
  it('stop at the first piece, capturing enemies only', () => {
    const fen = '8/3p4/8/8/1P1R4/8/8/8 w';
    expect(destinations(fen, 'd4')).toEqual(squares('c4 e4 f4 g4 h4 d1 d2 d3 d5 d6 d7'));
    expect(captures(fen, 'd4')).toEqual(['d7']);
  });
});

describe('Gryphon', () => {
  it('a friendly piece on the turning square blocks that whole path', () => {
    const fen = '8/8/8/4P3/3Y4/8/8/8 w';
    // Friendly on e5: no e5, f5…h5, e6…e8.
    expect(destinations(fen, 'd4')).toEqual(
      squares('c3 c5 e3 b5 a5 c6 c7 c8 f3 g3 h3 e2 e1 b3 a3 c2 c1'),
    );
  });

  it('may capture on the turning square, which ends the move', () => {
    const fen = '8/8/8/4p3/3Y4/8/8/8 w';
    const dests = destinations(fen, 'd4');
    expect(dests).toContain('e5');
    for (const sq of squares('f5 g5 h5 e6 e7 e8')) expect(dests).not.toContain(sq);
    expect(captures(fen, 'd4')).toEqual(['e5']);
  });

  it('slides stop at blockers and can capture at the end of a slide', () => {
    const fen = '8/4P3/8/6p1/3Y4/8/8/8 w';
    // Enemy g5 on the e5→east slide; friendly e7 on the e5→north slide.
    expect(destinations(fen, 'd4')).toEqual(
      squares('c3 c5 e3 e5 f5 g5 e6 b5 a5 c6 c7 c8 f3 g3 h3 e2 e1 b3 a3 c2 c1'),
    );
    expect(captures(fen, 'd4')).toEqual(['g5']);
  });

  it('has no plain orthogonal moves', () => {
    const dests = destinations(lonePiece('gryphon', 'd4'), 'd4');
    for (const sq of squares('d5 d3 c4 e4')) expect(dests).not.toContain(sq);
  });
});

describe('Cardinal', () => {
  it('a piece on the turning square blocks that path; enemies there can be captured', () => {
    const fen = '8/8/8/3p4/2PC4/8/8/8 w';
    // Enemy d5: capture only, no e6/f7/g8/c6/b7/a8. Friendly c4: no c4, b5, a6, b3, a2.
    expect(destinations(fen, 'd4')).toEqual(squares('d5 d3 e4 e2 f1 c2 b1 f5 g6 h7 f3 g2 h1'));
    expect(captures(fen, 'd4')).toEqual(['d5']);
  });

  it('has no plain diagonal moves', () => {
    const dests = destinations(lonePiece('cardinal', 'd4'), 'd4');
    for (const sq of squares('c3 c5 e3 e5')) expect(dests).not.toContain(sq);
  });
});

describe('Pawn', () => {
  it('moves one or two squares straight forward from the pawn row', () => {
    expect(destinations(lonePiece('pawn', 'e2'), 'e2')).toEqual(squares('e3 e4'));
    expect(destinations(lonePiece('pawn', 'e7', 'b'), 'e7')).toEqual(squares('e6 e5'));
  });

  it('moves only one square after leaving the pawn row', () => {
    expect(destinations(lonePiece('pawn', 'e3'), 'e3')).toEqual(['e4']);
    expect(destinations(lonePiece('pawn', 'e6', 'b'), 'e6')).toEqual(['e5']);
  });

  it('cannot double-move through or onto a piece', () => {
    expect(destinations('8/8/8/8/8/4p3/4P3/8 w', 'e2')).toEqual([]);
    expect(destinations('8/8/8/8/4p3/8/4P3/8 w', 'e2')).toEqual(['e3']);
  });

  it('captures diagonally forward only, and never straight ahead', () => {
    const fen = '8/8/8/8/8/3ppN2/4P3/8 w';
    expect(captures(fen, 'e2')).toEqual(['d3']);
    expect(destinations(fen, 'e2')).toEqual(['d3']);
  });

  it('Black captures toward rank 1', () => {
    expect(captures('8/4p3/3P1P2/8/8/8/8/8 b', 'e7')).toEqual(squares('d6 f6'));
  });
});

describe('Scout', () => {
  it('moves diagonally forward one or two squares from the pawn row', () => {
    expect(destinations(lonePiece('scout', 'd2'), 'd2')).toEqual(squares('c3 e3 b4 f4'));
    expect(destinations(lonePiece('scout', 'a2'), 'a2')).toEqual(squares('b3 c4'));
    expect(destinations(lonePiece('scout', 'd7', 'b'), 'd7')).toEqual(squares('c6 e6 b5 f5'));
  });

  it('moves one diagonal square after leaving the pawn row', () => {
    expect(destinations(lonePiece('scout', 'd3'), 'd3')).toEqual(squares('c4 e4'));
  });

  it('captures straight forward only', () => {
    const fen = '8/8/8/8/8/2ppp3/3S4/8 w';
    expect(captures(fen, 'd2')).toEqual(['d3']);
    // c3 and e3 are occupied (blocking both diagonal paths), and Scouts cannot capture diagonally.
    expect(destinations(fen, 'd2')).toEqual(['d3']);
  });

  it('never captures as part of a double move', () => {
    // Enemies on both double-move destinations, and straight ahead two squares.
    expect(destinations('8/8/8/8/1p1p1p2/8/3S4/8 w', 'd2')).toEqual(squares('c3 e3'));
  });

  it('cannot move straight forward to an empty square', () => {
    expect(destinations(lonePiece('scout', 'd3'), 'd3')).not.toContain('d4');
  });
});

describe('Sergeant', () => {
  it('moves one or two squares in any forward direction from the pawn row', () => {
    expect(destinations(lonePiece('sergeant', 'd2'), 'd2')).toEqual(squares('c3 d3 e3 b4 d4 f4'));
    expect(destinations(lonePiece('sergeant', 'd7', 'b'), 'd7')).toEqual(
      squares('c6 d6 e6 b5 d5 f5'),
    );
  });

  it('moves one square after leaving the pawn row', () => {
    expect(destinations(lonePiece('sergeant', 'd3'), 'd3')).toEqual(squares('c4 d4 e4'));
  });

  it('captures one square in any forward direction', () => {
    const fen = '8/8/8/8/8/2ppp3/3G4/8 w';
    expect(captures(fen, 'd2')).toEqual(squares('c3 d3 e3'));
    expect(destinations(fen, 'd2')).toEqual(squares('c3 d3 e3'));
  });

  it('never captures as part of a double move', () => {
    expect(destinations('8/8/8/8/1p1p1p2/8/3G4/8 w', 'd2')).toEqual(squares('c3 d3 e3'));
  });

  it('does not capture backward or sideways', () => {
    expect(captures('8/8/8/8/8/8/2pGp3/2ppp3 w', 'd2')).toEqual([]);
  });
});

describe('attacks', () => {
  it('infantry attack only their capture squares', () => {
    expect(attacks(lonePiece('pawn', 'e4'), 'e4')).toEqual(squares('d5 f5'));
    expect(attacks(lonePiece('scout', 'e4'), 'e4')).toEqual(['e5']);
    expect(attacks(lonePiece('sergeant', 'e4'), 'e4')).toEqual(squares('d5 e5 f5'));
    expect(attacks(lonePiece('pawn', 'e5', 'b'), 'e5')).toEqual(squares('d4 f4'));
  });

  it('include squares defended by friendly pieces', () => {
    expect(attacks('8/8/8/8/8/8/8/R1N5 w', 'a1')).toContain('c1');
    expect(attacks('8/8/8/8/8/8/8/R1N5 w', 'a1')).not.toContain('d1');
  });

  it('isSquareAttacked sees through leapers and stops sliders at blockers', () => {
    const { board } = parsePosition('4k3/8/8/8/4P3/8/8/4R1N1 w');
    expect(isSquareAttacked(board, parseSquare('e4'), 'w')).toBe(true); // rook defends
    expect(isSquareAttacked(board, parseSquare('e8'), 'w')).toBe(false); // blocked by e4
    expect(isSquareAttacked(board, parseSquare('f3'), 'w')).toBe(true); // knight
    expect(isSquareAttacked(board, parseSquare('d7'), 'b')).toBe(true); // king
    expect(isSquareAttacked(board, parseSquare('d6'), 'b')).toBe(false);
  });

  it('a Gryphon attacks along its bent path but not through a blocked turn', () => {
    const open = parsePosition('8/8/8/8/8/8/8/Y7 w').board;
    expect(isSquareAttacked(open, parseSquare('b8'), 'w')).toBe(true);
    expect(isSquareAttacked(open, parseSquare('h2'), 'w')).toBe(true);
    const blocked = parsePosition('8/8/8/8/8/8/1p6/Y7 w').board;
    expect(isSquareAttacked(blocked, parseSquare('b2'), 'w')).toBe(true);
    expect(isSquareAttacked(blocked, parseSquare('b8'), 'w')).toBe(false);
  });
});
