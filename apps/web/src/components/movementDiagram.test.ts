import { type PieceType, squareName } from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import { movementDiagram } from './movementDiagram';

function marks(type: PieceType) {
  const { marks } = movementDiagram(type);
  return Object.fromEntries([...marks].map(([sq, m]) => [squareName(sq), m]));
}

describe('movement diagrams', () => {
  it('distinguish moves from captures for infantry', () => {
    expect(marks('pawn')).toEqual({ d3: 'move', d4: 'move', c3: 'capture', e3: 'capture' });
    expect(marks('scout')).toEqual({
      c3: 'move',
      e3: 'move',
      b4: 'move',
      f4: 'move',
      d3: 'capture',
    });
    expect(marks('sergeant')).toEqual({
      c3: 'both',
      d3: 'both',
      e3: 'both',
      b4: 'move',
      d4: 'move',
      f4: 'move',
    });
  });

  it('mark every destination as move-or-capture for other pieces', () => {
    const knight = marks('knight');
    expect(Object.keys(knight).sort()).toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']);
    expect(new Set(Object.values(knight))).toEqual(new Set(['both']));
  });

  it('fit within the 7×7 window for every piece except long-range riders', () => {
    // The Falconer and Camel reach exactly three squares away; nothing leaps further.
    for (const type of ['falconer', 'camel', 'elephant'] as const) {
      for (const sq of Object.keys(marks(type))) {
        expect(sq[0]! <= 'g' && Number(sq[1]) <= 7).toBe(true);
      }
    }
  });
});
