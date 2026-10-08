import { describe, expect, it } from 'vitest';
import { parseSquare, squareName } from './board';
import {
  claimableDraw,
  claimDraw,
  createGame,
  type GameState,
  IllegalMoveError,
  inCheck,
  isPromotion,
  legalMoves,
  legalMovesFrom,
  moveHistory,
  playMove,
  repetitionCount,
  resign,
  undo,
} from './game';
import type { PieceType } from './pieces';
import { formatPosition, parsePosition } from './position';
import type { PromotionTypes } from './rules';
import { squares } from './testing';

function game(fen: string, promotionTypes?: PromotionTypes): GameState {
  const position = parsePosition(fen);
  return createGame(promotionTypes ? { position, promotionTypes } : { position });
}

/** Plays moves written as "e2e4" or "e7e8:queen". */
function play(state: GameState, ...moves: string[]): GameState {
  return moves.reduce((s, text) => {
    const [squaresPart, promotion] = text.split(':');
    const from = parseSquare(squaresPart!.slice(0, 2));
    const to = parseSquare(squaresPart!.slice(2, 4));
    return playMove(s, promotion ? { from, to, promotion: promotion as PieceType } : { from, to });
  }, state);
}

function destinationsFrom(state: GameState, from: string): string[] {
  return legalMovesFrom(state, parseSquare(from))
    .map((m) => squareName(m.to))
    .sort();
}

function moveList(state: GameState): string[] {
  return legalMoves(state)
    .map((m) => `${squareName(m.from)}${squareName(m.to)}${m.promotion ? `:${m.promotion}` : ''}`)
    .sort();
}

describe('King safety', () => {
  it('the King cannot move into check', () => {
    expect(destinationsFrom(game('k7/8/8/8/8/8/r7/4K3 w'), 'e1')).toEqual(squares('d1 f1'));
  });

  it('a pinned Rook may only move along the pin line', () => {
    expect(destinationsFrom(game('k3r3/8/8/8/8/8/4R3/4K3 w'), 'e2')).toEqual(
      squares('e3 e4 e5 e6 e7 e8'),
    );
  });

  it('a pinned Gryphon cannot move at all (none of its moves stay on the file)', () => {
    expect(destinationsFrom(game('k3r3/8/8/8/8/8/4Y3/4K3 w'), 'e2')).toEqual([]);
  });

  it('check must be resolved by moving, blocking, or capturing', () => {
    const state = game('k3r3/8/8/8/8/8/8/2B1K2N w');
    expect(inCheck(state)).toBe(true);
    expect(moveList(state)).toEqual(['c1e3', 'e1d1', 'e1d2', 'e1f1', 'e1f2']);
  });

  it('a leaping check cannot be blocked', () => {
    // Falconer e3 checks e1 by jumping; Rh2-e2 would not help.
    const state = game('k7/8/8/8/8/4f3/7R/4K3 w');
    expect(inCheck(state)).toBe(true);
    expect(moveList(state)).toEqual(['e1d2', 'e1e2', 'e1f2']);
  });

  it('infantry give check along their capture pattern only', () => {
    expect(inCheck(game('8/8/8/4k3/4S3/8/8/K7 b'))).toBe(true);
    expect(inCheck(game('8/8/8/3k4/4G3/8/8/K7 b'))).toBe(true);
    expect(inCheck(game('8/8/8/4k3/4P3/8/8/K7 b'))).toBe(false);
    expect(inCheck(game('8/8/8/3k4/4S3/8/8/K7 b'))).toBe(false);
  });

  it('the King cannot capture a defended piece (Bastion defends by jumping)', () => {
    const state = game('4k3/4Q3/8/4T3/8/8/8/K7 b');
    expect(state.result).toEqual({ kind: 'checkmate', winner: 'w' });
    const undefended = game('4k3/4Q3/8/8/8/8/8/K7 b');
    expect(moveList(undefended)).toEqual(['e8e7']);
  });
});

describe('game endings', () => {
  it("Fool's mate with the standard army", () => {
    const start = game('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
    const end = play(start, 'f2f3', 'e7e5', 'g2g4', 'd8h4');
    expect(end.result).toEqual({ kind: 'checkmate', winner: 'b' });
    expect(legalMoves(end)).toEqual([]);
  });

  it('Gryphon back-rank mate along its bent path', () => {
    // Gryphon b7 steps to c8 and slides along rank 8 to h8; g8 is covered by the same line.
    expect(game('7k/1Y4pp/8/8/8/8/8/K7 b').result).toEqual({ kind: 'checkmate', winner: 'w' });
    // A piece on the turning square c8 means there is no check at all.
    const blocked = game('2n4k/1Y4pp/8/8/8/8/8/K7 b');
    expect(inCheck(blocked)).toBe(false);
    expect(blocked.result).toBeNull();
  });

  it('a Gryphon check can be blocked on the slide', () => {
    expect(moveList(game('7k/1Y4pp/8/8/8/K7/8/4r3 b'))).toEqual(['e1e8']);
  });

  it('stalemate', () => {
    expect(game('k7/8/1Q6/8/8/8/8/7K b').result).toEqual({ kind: 'draw', reason: 'stalemate' });
    // Elephant covers g8 and h7, Bastion covers g7.
    expect(game('7k/8/5E2/6T1/8/8/8/K7 b').result).toEqual({ kind: 'draw', reason: 'stalemate' });
  });

  it('no moves can be played after the game ends', () => {
    const mated = game('7k/1Y4pp/8/8/8/8/8/K7 b');
    expect(() => play(mated, 'g7g6')).toThrow(IllegalMoveError);
  });
});

describe('promotion', () => {
  const choices: PromotionTypes = { w: ['gryphon', 'camel'], b: ['rook'] };

  it('is mandatory and offers each type from the original army', () => {
    const state = game('k7/4P3/8/8/8/8/8/K7 w', choices);
    expect(moveList(state).filter((m) => m.startsWith('e7'))).toEqual([
      'e7e8:camel',
      'e7e8:gryphon',
    ]);
    expect(isPromotion(state, parseSquare('e7'), parseSquare('e8'))).toBe(true);
    expect(() => play(state, 'e7e8')).toThrow(IllegalMoveError);
    expect(() => play(state, 'e7e8:queen')).toThrow(IllegalMoveError);
  });

  it('places the chosen piece, even a type no longer on the board', () => {
    const after = play(game('k7/4P3/8/8/8/8/8/K7 w', choices), 'e7e8:gryphon');
    expect(formatPosition(after.position)).toBe('k3Y3/8/8/8/8/8/8/K7 b');
  });

  it('Scouts promote by diagonal moves and by straight-ahead captures', () => {
    const state = game('k2n4/3S4/8/8/8/8/8/7K w', { w: ['knight'], b: [] });
    expect(moveList(state).filter((m) => m.startsWith('d7'))).toEqual([
      'd7c8:knight',
      'd7d8:knight',
      'd7e8:knight',
    ]);
  });

  it('Black promotes on rank 1', () => {
    const state = game('k7/8/8/8/8/8/3g4/7K b', choices);
    expect(moveList(state).filter((m) => m.startsWith('d2'))).toEqual([
      'd2c1:rook',
      'd2d1:rook',
      'd2e1:rook',
    ]);
  });

  it('a promotion can deliver checkmate', () => {
    const mate = play(game('7k/P5pp/8/8/8/8/8/K7 w', { w: ['rook'], b: [] }), 'a7a8:rook');
    expect(mate.result).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('defaults to the types each side has on the board', () => {
    const state = game('k6r/4P3/8/8/8/8/8/K1N5 w');
    expect(state.promotionTypes).toEqual({ w: ['knight'], b: ['rook'] });
  });
});

describe('undo, history, and clocks', () => {
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';

  it('undo returns the exact previous state', () => {
    const s0 = game(START);
    const s1 = play(s0, 'g1f3');
    const s2 = play(s1, 'e7e5');
    expect(undo(s2)).toBe(s1);
    expect(undo(undo(s2))).toBe(s0);
    expect(undo(s0)).toBe(s0);
  });

  it('undo restores captures, promotions, clocks, and results', () => {
    const s0 = game('k7/4P3/8/8/8/8/8/K6r w', { w: ['rook'], b: ['rook'] });
    const s1 = play(s0, 'a1b2');
    const s2 = play(s1, 'h1h8');
    const s3 = play(s2, 'e7e8:rook');
    expect(formatPosition(s3.position)).toBe('k3R2r/8/8/8/8/8/1K6/8 b');
    const s4 = play(s3, 'h8e8');
    expect(s4.halfmoveClock).toBe(0);
    expect(formatPosition(undo(s4).position)).toBe(formatPosition(s3.position));
    expect(formatPosition(undo(undo(s4)).position)).toBe('k6r/4P3/8/8/8/8/1K6/8 w');
    expect(undo(undo(s4)).halfmoveClock).toBe(2);
  });

  it('counts the halfmove clock: reset by captures and infantry moves', () => {
    const s = play(game(START), 'g1f3', 'g8f6', 'f3g1');
    expect(s.halfmoveClock).toBe(3);
    expect(play(s, 'e7e5').halfmoveClock).toBe(0);
    expect(s.ply).toBe(3);
  });

  it('records the move history in order', () => {
    const s = play(game(START), 'e2e4', 'e7e5', 'g1f3');
    expect(moveHistory(s).map((m) => `${squareName(m.from)}${squareName(m.to)}`)).toEqual([
      'e2e4',
      'e7e5',
      'g1f3',
    ]);
  });

  it('never mutates earlier states', () => {
    const s0 = game(START);
    const before = formatPosition(s0.position);
    play(s0, 'e2e4');
    legalMoves(s0);
    expect(formatPosition(s0.position)).toBe(before);
  });

  it('can undo out of checkmate', () => {
    const mated = play(game(START), 'f2f3', 'e7e5', 'g2g4', 'd8h4');
    const back = undo(mated);
    expect(back.result).toBeNull();
    expect(legalMoves(back).length).toBeGreaterThan(0);
  });
});

describe('resignation', () => {
  it('ends the game for the opponent and can be undone', () => {
    const s0 = game('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
    const resigned = resign(s0, 'w');
    expect(resigned.result).toEqual({ kind: 'resignation', winner: 'b' });
    expect(legalMoves(resigned)).toEqual([]);
    expect(resign(resigned, 'b')).toBe(resigned);
    expect(undo(resigned)).toBe(s0);
  });
});

describe('position validation', () => {
  it('rejects impossible positions', () => {
    expect(() => game('k7/8/8/8/8/8/8/KK6 w')).toThrow(/more than one King/);
    expect(() => game('k3P3/8/8/8/8/8/8/K7 b')).toThrow(/Infantry/);
    expect(() => game('k7/8/8/8/8/8/8/K3p3 w')).toThrow(/Infantry/);
    expect(() => game('k7/8/8/8/8/8/8/R6K w')).toThrow(/not to move is in check/);
  });
});

describe('draws by repetition and move count', () => {
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';
  const KNIGHT_DANCE = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];

  it('threefold repetition may be claimed, but does not end the game by itself', () => {
    const twice = play(game(START), ...KNIGHT_DANCE);
    expect(repetitionCount(twice)).toBe(2);
    expect(claimableDraw(twice)).toBeNull();
    expect(() => claimDraw(twice)).toThrow();

    const thrice = play(twice, ...KNIGHT_DANCE);
    expect(repetitionCount(thrice)).toBe(3);
    expect(thrice.result).toBeNull();
    expect(claimableDraw(thrice)).toBe('threefold-repetition');

    const claimed = claimDraw(thrice);
    expect(claimed.result).toEqual({ kind: 'draw', reason: 'threefold-repetition' });
    expect(legalMoves(claimed)).toEqual([]);
    expect(undo(claimed)).toBe(thrice);
  });

  it('positions only repeat with the same side to move', () => {
    // After Nf3 Nf6 Ng1, the knights mirror the start but it is Black to move.
    const s = play(game(START), 'g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3');
    expect(repetitionCount(s)).toBe(2);
    expect(repetitionCount(undo(s))).toBe(2);
    expect(repetitionCount(play(s, 'b8c6'))).toBe(1);
  });

  it('fivefold repetition ends the game automatically', () => {
    const four = play(game(START), ...KNIGHT_DANCE, ...KNIGHT_DANCE, ...KNIGHT_DANCE);
    expect(four.result).toBeNull();
    const five = play(four, ...KNIGHT_DANCE);
    expect(five.result).toEqual({ kind: 'draw', reason: 'fivefold-repetition' });
  });

  it('a capture or infantry move resets the repetition window', () => {
    const s = play(game(START), ...KNIGHT_DANCE, 'e2e3', 'e7e6', ...KNIGHT_DANCE);
    expect(repetitionCount(s)).toBe(2);
  });

  it('the 50-move rule may be claimed after 100 half-moves', () => {
    const s = game('4k3/8/8/8/8/8/8/R6K w');
    const at99 = { ...s, halfmoveClock: 99 };
    expect(claimableDraw(at99)).toBeNull();
    const at100 = play(at99, 'a1b1');
    expect(at100.halfmoveClock).toBe(100);
    expect(at100.result).toBeNull();
    expect(claimableDraw(at100)).toBe('fifty-move-rule');
    expect(claimDraw(at100).result).toEqual({ kind: 'draw', reason: 'fifty-move-rule' });
  });

  it('the 75-move rule ends the game automatically, unless the last move mates', () => {
    const quiet = play({ ...game('4k3/8/8/8/8/8/8/R6K w'), halfmoveClock: 149 }, 'a1b1');
    expect(quiet.result).toEqual({ kind: 'draw', reason: 'seventy-five-move-rule' });
    const mate = play({ ...game('7k/6pp/8/8/8/8/8/R5K1 w'), halfmoveClock: 149 }, 'a1a8');
    expect(mate.result).toEqual({ kind: 'checkmate', winner: 'w' });
  });
});
