import { describe, expect, it } from 'vitest';
import { parseSquare } from './board';
import { createGame, type GameState, legalMoves, playMove } from './game';
import { algebraicHistory, parseCoordinate, toAlgebraic, toCoordinate } from './notation';
import { parsePosition } from './position';
import type { PromotionTypes } from './rules';

function game(fen: string, promotionTypes?: PromotionTypes): GameState {
  const position = parsePosition(fen);
  return createGame(promotionTypes ? { position, promotionTypes } : { position });
}

function play(state: GameState, ...moves: string[]): GameState {
  return moves.reduce((s, text) => playMove(s, parseCoordinate(text)), state);
}

/** Algebraic notation of the legal move from → to (first promotion choice if several). */
function san(state: GameState, from: string, to: string): string {
  const move = legalMoves(state).find(
    (m) => m.from === parseSquare(from) && m.to === parseSquare(to),
  );
  if (!move) throw new Error(`No legal move ${from}${to}`);
  return toAlgebraic(state, move);
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';

describe('algebraic notation', () => {
  it('matches standard chess notation for orthodox pieces', () => {
    const s = play(game(START), 'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5c6', 'd7c6');
    expect(algebraicHistory(s)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6']);
  });

  it('marks check and checkmate', () => {
    expect(algebraicHistory(play(game(START), 'e2e4', 'f7f6', 'd1h5'))).toEqual([
      'e4',
      'f6',
      'Qh5+',
    ]);
    expect(algebraicHistory(play(game(START), 'f2f3', 'e7e5', 'g2g4', 'd8h4'))).toEqual([
      'f3',
      'e5',
      'g4',
      'Qh4#',
    ]);
  });

  it('writes Scouts and Sergeants with their letters', () => {
    expect(san(game('k7/8/8/8/8/8/3S4/K7 w'), 'd2', 'c3')).toBe('Sc3');
    expect(san(game('k7/8/8/8/8/3p4/3G4/K7 w'), 'd2', 'd3')).toBe('Gxd3');
  });

  it('writes promotions with "="', () => {
    const state = game('k7/4P3/8/8/8/8/8/K7 w', { w: ['rook'], b: [] });
    expect(san(state, 'e7', 'e8')).toBe('e8=R+');
  });

  it('disambiguates by file, then rank, then both', () => {
    expect(san(game('k7/8/8/8/8/8/8/KN3N2 w'), 'b1', 'd2')).toBe('Nbd2');
    expect(san(game('k7/8/8/N7/8/8/8/N6K w'), 'a1', 'b3')).toBe('N1b3');
    expect(san(game('k7/8/8/2N5/8/8/8/N1N4K w'), 'c1', 'b3')).toBe('Nc1b3');
  });
});

describe('coordinate notation', () => {
  it('round-trips moves and promotions', () => {
    expect(toCoordinate({ from: parseSquare('e2'), to: parseSquare('e4') })).toBe('e2e4');
    const promo = { from: parseSquare('e7'), to: parseSquare('e8'), promotion: 'gryphon' } as const;
    expect(toCoordinate(promo)).toBe('e7e8Y');
    expect(parseCoordinate('e7e8Y')).toEqual(promo);
    expect(parseCoordinate('e7e8y')).toEqual(promo);
  });

  it('rejects malformed text', () => {
    expect(() => parseCoordinate('e2')).toThrow();
    expect(() => parseCoordinate('e2e9')).toThrow();
    expect(() => parseCoordinate('e7e8X')).toThrow(/promotion/);
  });
});
