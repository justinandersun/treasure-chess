import { describe, expect, it } from 'vitest';
import { PIECE_DEFINITIONS, PIECES, piece, pieceTypeFromSymbol, symmetricVectors } from './pieces';

/** Spec §2.4, in table order: [type, symbol, family, cost]. */
const SPEC_TABLE = [
  ['pawn', 'P', 'infantry', 1],
  ['scout', 'S', 'infantry', 1],
  ['sergeant', 'G', 'infantry', 2],
  ['bastion', 'T', 'rook', 3],
  ['rook', 'R', 'rook', 5],
  ['gryphon', 'Y', 'rook', 6],
  ['priest', 'I', 'bishop', 2],
  ['bishop', 'B', 'bishop', 3],
  ['cardinal', 'C', 'bishop', 5],
  ['camel', 'M', 'knight', 2],
  ['knight', 'N', 'knight', 3],
  ['elephant', 'E', 'knight', 6],
  ['consort', 'O', 'royalty', 3],
  ['falconer', 'F', 'royalty', 8],
  ['queen', 'Q', 'royalty', 9],
  ['king', 'K', 'royalty', 1],
] as const;

describe('piece catalog', () => {
  it('matches the spec table exactly, in order', () => {
    expect(PIECE_DEFINITIONS.map((d) => [d.type, d.symbol, d.family, d.cost])).toEqual(
      SPEC_TABLE.map((row) => [...row]),
    );
  });

  it('has unique symbols that round-trip', () => {
    const symbols = PIECE_DEFINITIONS.map((d) => d.symbol);
    expect(new Set(symbols).size).toBe(16);
    for (const d of PIECE_DEFINITIONS) {
      expect(pieceTypeFromSymbol(d.symbol)).toBe(d.type);
      expect(pieceTypeFromSymbol(d.symbol.toLowerCase())).toBe(d.type);
    }
    expect(pieceTypeFromSymbol('X')).toBeUndefined();
  });

  it('marks only the King as royal', () => {
    expect(PIECE_DEFINITIONS.filter((d) => d.royal).map((d) => d.type)).toEqual(['king']);
  });

  it('interns piece values', () => {
    expect(piece('knight', 'w')).toBe(piece('knight', 'w'));
    expect(piece('knight', 'w')).not.toBe(piece('knight', 'b'));
    expect(Object.isFrozen(piece('queen', 'b'))).toBe(true);
  });

  it('symmetricVectors produces each distinct variant once', () => {
    expect(symmetricVectors(1, 0)).toHaveLength(4);
    expect(symmetricVectors(1, 1)).toHaveLength(4);
    expect(symmetricVectors(1, 2)).toHaveLength(8);
    expect(symmetricVectors(2, 2)).toHaveLength(4);
  });

  it('defines infantry movement only for infantry', () => {
    for (const d of PIECE_DEFINITIONS) {
      const isInfantry = d.movement.some((c) => c.kind === 'infantry');
      expect(isInfantry).toBe(d.family === 'infantry');
    }
    expect(PIECES.king.movement).toEqual(PIECES.consort.movement);
  });
});
