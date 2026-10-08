import { parseSquare, squareName } from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import { displayPosition, displaySquares, navigate } from './boardGeometry';

const name = (sq: number | null) => (sq === null ? null : squareName(sq));

describe('board geometry', () => {
  it('orders squares from the viewer’s top-left', () => {
    const white = displaySquares('w').map(squareName);
    expect(white.slice(0, 2)).toEqual(['a8', 'b8']);
    expect(white.at(-1)).toBe('h1');
    const black = displaySquares('b').map(squareName);
    expect(black.slice(0, 2)).toEqual(['h1', 'g1']);
    expect(black.at(-1)).toBe('a8');
  });

  it('displayPosition inverts displaySquares', () => {
    for (const orientation of ['w', 'b'] as const) {
      displaySquares(orientation).forEach((sq, i) => {
        expect(displayPosition(sq, orientation)).toEqual({ row: Math.floor(i / 8), col: i % 8 });
      });
    }
  });

  it('arrow keys move in screen directions for either orientation', () => {
    const e4 = parseSquare('e4');
    expect(name(navigate(e4, 'ArrowUp', 'w'))).toBe('e5');
    expect(name(navigate(e4, 'ArrowRight', 'w'))).toBe('f4');
    expect(name(navigate(e4, 'ArrowUp', 'b'))).toBe('e3');
    expect(name(navigate(e4, 'ArrowRight', 'b'))).toBe('d4');
    expect(name(navigate(e4, 'Home', 'w'))).toBe('a4');
    expect(name(navigate(e4, 'End', 'b'))).toBe('a4');
  });

  it('stops at the edge and ignores other keys', () => {
    expect(name(navigate(parseSquare('a8'), 'ArrowUp', 'w'))).toBe('a8');
    expect(name(navigate(parseSquare('a8'), 'ArrowLeft', 'w'))).toBe('a8');
    expect(navigate(parseSquare('a8'), 'Enter', 'w')).toBeNull();
  });
});
