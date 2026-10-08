import {
  createGame,
  type GameState,
  parsePosition,
  parseSquare,
  playMove,
  resign,
  squareName,
} from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import { handleTap, type Selection, selectionMarks } from './playInteraction';

const sq = parseSquare;
const game = (fen: string): GameState => createGame({ position: parsePosition(fen) });

function marks(state: GameState, selection: Selection) {
  return Object.fromEntries(
    [...selectionMarks(state, selection)].map(([s, kind]) => [squareName(s), kind]),
  );
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';

describe('tapping the board during play', () => {
  it('selects your own piece, reselects another, and clears on a second tap', () => {
    const g = game(START);
    expect(handleTap(g, null, sq('g1'))).toEqual({
      kind: 'select',
      selection: { square: sq('g1'), mode: 'move' },
    });
    const selected: Selection = { square: sq('g1'), mode: 'move' };
    expect(handleTap(g, selected, sq('b1'))).toEqual({
      kind: 'select',
      selection: { square: sq('b1'), mode: 'move' },
    });
    expect(handleTap(g, selected, sq('g1'))).toEqual({ kind: 'select', selection: null });
    expect(handleTap(g, selected, sq('e4'))).toEqual({ kind: 'select', selection: null });
  });

  it('plays a move to a legal destination', () => {
    const selected: Selection = { square: sq('g1'), mode: 'move' };
    expect(handleTap(game(START), selected, sq('f3'))).toEqual({
      kind: 'move',
      move: { from: sq('g1'), to: sq('f3') },
    });
  });

  it('asks for a promotion choice when the move promotes', () => {
    const g = createGame({
      position: parsePosition('k7/4P3/8/8/8/8/8/K7 w'),
      promotionTypes: { w: ['gryphon', 'camel'], b: [] },
    });
    expect(handleTap(g, { square: sq('e7'), mode: 'move' }, sq('e8'))).toEqual({
      kind: 'promote',
      from: sq('e7'),
      to: sq('e8'),
      choices: ['gryphon', 'camel'],
    });
  });

  it("inspects the opponent's pieces instead of moving them", () => {
    const g = game(START);
    expect(handleTap(g, null, sq('g8'))).toEqual({
      kind: 'select',
      selection: { square: sq('g8'), mode: 'inspect' },
    });
    // Tapping a square the inspected piece could reach does not move it.
    expect(handleTap(g, { square: sq('g8'), mode: 'inspect' }, sq('f6'))).toEqual({
      kind: 'select',
      selection: null,
    });
  });

  it('only inspects once the game is over', () => {
    const over = resign(game(START), 'w');
    expect(handleTap(over, null, sq('g1'))).toEqual({
      kind: 'select',
      selection: { square: sq('g1'), mode: 'inspect' },
    });
  });
});

describe('selection marks', () => {
  it('show legal moves and captures for your own piece', () => {
    const g = playMove(game(START), { from: sq('e2'), to: sq('e4') });
    const after = playMove(g, { from: sq('d7'), to: sq('d5') });
    expect(marks(after, { square: sq('e4'), mode: 'move' })).toEqual({
      e5: 'move',
      d5: 'capture',
    });
  });

  it('exclude moves that would leave the King in check', () => {
    const pinned = game('k3r3/8/8/8/8/8/4N3/4K3 w');
    expect(marks(pinned, { square: sq('e2'), mode: 'move' })).toEqual({});
  });

  it("show an inspected piece's moves, captures, and attacked squares", () => {
    // Black pawn e7 with a White knight on d6: it attacks d6 (capture) and f6 (attack only).
    const g = game('k7/4p3/3N4/8/8/8/8/K7 w');
    expect(marks(g, { square: sq('e7'), mode: 'inspect' })).toEqual({
      e6: 'move',
      e5: 'move',
      d6: 'capture',
      f6: 'attack',
    });
  });
});
