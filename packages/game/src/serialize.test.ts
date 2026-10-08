import { describe, expect, it } from 'vitest';
import { createGame, type GameState, moveHistory, playMove, resign, claimDraw } from './game';
import { parseCoordinate } from './notation';
import { formatPosition, parsePosition } from './position';
import { deserializeGame, SavedGameError, serializeGame } from './serialize';

function play(state: GameState, ...moves: string[]): GameState {
  return moves.reduce((s, text) => playMove(s, parseCoordinate(text)), state);
}

function roundTrip(state: GameState): GameState {
  return deserializeGame(JSON.parse(JSON.stringify(serializeGame(state))));
}

function expectSameGame(a: GameState, b: GameState) {
  expect(b.positionKey).toBe(a.positionKey);
  expect(b.ply).toBe(a.ply);
  expect(b.halfmoveClock).toBe(a.halfmoveClock);
  expect(b.result).toEqual(a.result);
  expect(b.promotionTypes).toEqual(a.promotionTypes);
  expect(moveHistory(b)).toEqual(moveHistory(a));
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';

describe('saved games', () => {
  it('round-trip moves, captures, and promotions', () => {
    const s0 = createGame({
      position: parsePosition('k7/4P3/8/8/8/8/8/K6r w'),
      promotionTypes: { w: ['gryphon', 'rook'], b: ['rook'] },
    });
    const s = play(s0, 'a1b2', 'h1h8', 'e7e8Y', 'h8e8');
    const saved = serializeGame(s);
    expect(saved).toEqual({
      version: 1,
      start: 'k7/4P3/8/8/8/8/8/K6r w',
      promotionTypes: { w: ['gryphon', 'rook'], b: ['rook'] },
      actions: ['a1b2', 'h1h8', 'e7e8Y', 'h8e8'],
    });
    expectSameGame(s, roundTrip(s));
  });

  it('round-trip a fresh game', () => {
    const s = createGame({ position: parsePosition(START) });
    expectSameGame(s, roundTrip(s));
  });

  it('round-trip resignations and claimed draws, which stay undoable', () => {
    const resigned = resign(play(createGame({ position: parsePosition(START) }), 'e2e4'), 'b');
    expect(serializeGame(resigned).actions).toEqual(['e2e4', 'resign:b']);
    const restored = roundTrip(resigned);
    expectSameGame(resigned, restored);
    expect(restored.previous?.result).toBeNull();

    const dance = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];
    const claimed = claimDraw(
      play(createGame({ position: parsePosition(START) }), ...dance, ...dance),
    );
    expect(serializeGame(claimed).actions.at(-1)).toBe('claim-draw');
    expectSameGame(claimed, roundTrip(claimed));
  });

  it('restore to the same board', () => {
    const s = play(createGame({ position: parsePosition(START) }), 'e2e4', 'e7e5', 'g1f3');
    expect(formatPosition(roundTrip(s).position)).toBe(formatPosition(s.position));
  });

  it('reject invalid data', () => {
    const valid = serializeGame(createGame({ position: parsePosition(START) }));
    const bad: unknown[] = [
      null,
      'nope',
      { ...valid, version: 2 },
      { ...valid, start: 42 },
      { ...valid, actions: 'e2e4' },
      { ...valid, promotionTypes: { w: ['dragon'], b: [] } },
      { ...valid, actions: ['e2e5'] },
      { ...valid, actions: ['e2e4', 'resign:b', 'e7e5'] },
      { ...valid, actions: ['claim-draw'] },
      { ...valid, start: 'not a position' },
    ];
    for (const data of bad) expect(() => deserializeGame(data)).toThrow(SavedGameError);
  });
});
