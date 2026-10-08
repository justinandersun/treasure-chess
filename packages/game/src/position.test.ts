import { describe, expect, it } from 'vitest';
import { isLightSquare, NO_SQUARE, offsetSquare, parseSquare, squareName } from './board';
import { formatPosition, parsePosition, pieceAt } from './position';

describe('squares', () => {
  it('name and parse squares', () => {
    expect(parseSquare('a1')).toBe(0);
    expect(parseSquare('h1')).toBe(7);
    expect(parseSquare('a2')).toBe(8);
    expect(parseSquare('h8')).toBe(63);
    for (let sq = 0; sq < 64; sq++) expect(parseSquare(squareName(sq))).toBe(sq);
    expect(() => parseSquare('i1')).toThrow();
    expect(() => parseSquare('a9')).toThrow();
  });

  it('offsets stay on the board', () => {
    expect(offsetSquare(parseSquare('h4'), 1, 0)).toBe(NO_SQUARE);
    expect(offsetSquare(parseSquare('a4'), -1, 0)).toBe(NO_SQUARE);
    expect(offsetSquare(parseSquare('d8'), 0, 1)).toBe(NO_SQUARE);
    expect(squareName(offsetSquare(parseSquare('d4'), 1, 2))).toBe('e6');
  });

  it('colors squares with a1 dark', () => {
    expect(isLightSquare(parseSquare('a1'))).toBe(false);
    expect(isLightSquare(parseSquare('h1'))).toBe(true);
    expect(isLightSquare(parseSquare('d1'))).toBe(true);
    expect(isLightSquare(parseSquare('e1'))).toBe(false);
  });
});

describe('position text', () => {
  const sample = 'tifkqycm/sgpppgsp/8/8/8/8/PSGPPGSP/MCYQKFIT b';

  it('round-trips', () => {
    expect(formatPosition(parsePosition(sample))).toBe(sample);
    expect(formatPosition(parsePosition('8/8/8/3Y4/8/8/8/8 w'))).toBe('8/8/8/3Y4/8/8/8/8 w');
  });

  it('places pieces by color and square', () => {
    const pos = parsePosition(sample);
    expect(pos.turn).toBe('b');
    expect(pieceAt(pos, parseSquare('e1'))).toEqual({ type: 'king', color: 'w' });
    expect(pieceAt(pos, parseSquare('a8'))).toEqual({ type: 'bastion', color: 'b' });
    expect(pieceAt(pos, parseSquare('b2'))).toEqual({ type: 'scout', color: 'w' });
    expect(pieceAt(pos, parseSquare('e4'))).toBeNull();
  });

  it('defaults to White to move', () => {
    expect(parsePosition('8/8/8/8/8/8/8/8').turn).toBe('w');
  });

  it('rejects malformed input', () => {
    expect(() => parsePosition('8/8/8/8/8/8/8 w')).toThrow();
    expect(() => parsePosition('9/8/8/8/8/8/8/8 w')).toThrow();
    expect(() => parsePosition('7X/8/8/8/8/8/8/8 w')).toThrow();
    expect(() => parsePosition('7/8/8/8/8/8/8/8 w')).toThrow();
    expect(() => parsePosition('8/8/8/8/8/8/8/8 x')).toThrow();
  });
});
