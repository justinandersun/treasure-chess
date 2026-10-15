import { describe, expect, it } from 'vitest';
import { createGameFromArmies } from '../army';
import { parseSquare, squareName } from '../board';
import { createGame, type GameState, legalMoves, playMove } from '../game';
import type { Move } from '../movegen';
import { parseCoordinate } from '../notation';
import { parsePosition } from '../position';
import { PRESETS } from '../presets';
import { createRng } from '../rng';
import { hashPosition } from '../zobrist';
import { DIFFICULTY_SEARCH } from './difficulty';
import { findBestMove, MATE_SCORE, type SearchOptions } from './search';
import { SearchPosition } from './searchPosition';

const game = (fen: string): GameState => createGame({ position: parsePosition(fen) });
const DEPTH = { timeMs: Infinity, maxDepth: 4 } as const;
const coords = (m: Move) => `${squareName(m.from)}${squareName(m.to)}`;

function best(state: GameState, options: SearchOptions = DEPTH) {
  const result = findBestMove(state, options);
  if (!result) throw new Error('no move');
  return result;
}

/** Independent check: after `move`, every reply allows a checkmating move. */
function forcesMateInTwo(state: GameState, move: Move): boolean {
  const after = playMove(state, move);
  return legalMoves(after).every((reply) => {
    const s = playMove(after, reply);
    return legalMoves(s).some((m) => playMove(s, m).result?.kind === 'checkmate');
  });
}

describe('findBestMove', () => {
  it('finds mate in one', () => {
    const state = game('7k/6pp/8/8/8/8/8/R5K1 w');
    const result = best(state);
    expect(coords(result.move)).toBe('a1a8');
    expect(result.score).toBe(MATE_SCORE - 1);
  });

  it('finds a Gryphon mate in one along its bent path', () => {
    const state = game('7k/6pp/Y7/8/8/8/8/K7 w');
    const { move } = best(state);
    expect(playMove(state, move).result).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('finds a forced mate in two', () => {
    const state = game('7k/8/5K2/8/8/8/8/1R6 w');
    const result = best(state);
    expect(result.score).toBe(MATE_SCORE - 3);
    expect(forcesMateInTwo(state, result.move)).toBe(true);
  });

  it('wins material when it can', () => {
    expect(coords(best(game('q3k3/8/8/8/8/8/8/R3K3 w')).move)).toBe('a1a8');
  });

  it('does not stalemate when winning', () => {
    const state = game('k7/8/8/2Q5/8/8/8/K7 w');
    const after = playMove(state, best(state).move);
    expect(after.result).toBeNull();
  });

  it('defends against mate in one', () => {
    // Black threatens ...Ra1#; White must deal with the back rank.
    const state = game('r5k1/5ppp/8/8/8/8/5PPP/6K1 w');
    const after = playMove(state, best(state).move);
    const blackMates = legalMoves(after).some(
      (m) => playMove(after, m).result?.kind === 'checkmate',
    );
    expect(blackMates).toBe(false);
  });

  it('returns the only legal move immediately, and null when the game is over', () => {
    // The King must capture the checking rook on d1; every other square is covered.
    const forced = game('k7/8/8/8/8/8/r7/3rK3 w');
    expect(legalMoves(forced)).toHaveLength(1);
    const result = best(forced, { timeMs: Infinity, maxDepth: 64 });
    expect(coords(result.move)).toBe('e1d1');
    expect(result.depth).toBe(0);
    expect(findBestMove(game('7k/1Y4pp/8/8/8/8/8/K7 b'))).toBeNull();
  });

  it('respects its time budget', () => {
    const state = createGameFromArmies(PRESETS[0]!.deployment, PRESETS[5]!.deployment);
    const start = Date.now();
    const result = best(state, { timeMs: 100, maxDepth: 64 });
    expect(Date.now() - start).toBeLessThan(600);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(legalMoves(state).some((m) => coords(m) === coords(result.move))).toBe(true);
  });
});

describe('self-play', () => {
  it('always plays legal moves until the game ends or a move cap', () => {
    const pairs = [
      [0, 1],
      [2, 3],
      [4, 5],
    ] as const;
    for (const [w, b] of pairs) {
      let state = createGameFromArmies(PRESETS[w]!.deployment, PRESETS[b]!.deployment);
      for (let ply = 0; ply < 80 && !state.result; ply++) {
        const result = findBestMove(state, { timeMs: Infinity, maxDepth: 2, seed: ply + 1 });
        expect(result).not.toBeNull();
        const move = result!.move;
        expect(
          legalMoves(state).some(
            (m) => coords(m) === coords(move) && m.promotion === move.promotion,
          ),
        ).toBe(true);
        state = playMove(state, move);
      }
    }
  });
});

describe('SearchPosition', () => {
  it('keeps its hash equal to a from-scratch hash through make and unmake', () => {
    const rng = createRng(11);
    const start = createGameFromArmies(PRESETS[5]!.deployment, PRESETS[1]!.deployment);
    const pos = new SearchPosition(start.position, start.promotionTypes);
    const original = { lo: pos.lo, hi: pos.hi };
    const made: Move[] = [];
    for (let i = 0; i < 40; i++) {
      const mover = pos.turn;
      const moves = pos.moves().filter((m) => {
        pos.make(m);
        const ok = !pos.inCheck(mover);
        pos.unmake(m);
        return ok;
      });
      if (moves.length === 0) break;
      const move = moves[Math.floor(rng() * moves.length)]!;
      pos.make(move);
      made.push(move);
      expect({ lo: pos.lo, hi: pos.hi }).toEqual(hashPosition(pos.board, pos.turn));
    }
    for (const move of made.reverse()) pos.unmake(move);
    expect({ lo: pos.lo, hi: pos.hi }).toEqual(original);
    expect(pos.board).toEqual(start.position.board);
  });

  it('detects repeated positions with the same side to move', () => {
    const state = game('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w');
    const pos = new SearchPosition(state.position, state.promotionTypes);
    for (const text of ['g1f3', 'g8f6', 'f3g1']) {
      const { from, to } = parseCoordinate(text);
      pos.make({ from, to, piece: 'knight' });
      expect(pos.isRepetition()).toBe(false);
    }
    pos.make({ from: parseSquare('f6'), to: parseSquare('g8'), piece: 'knight' });
    expect(pos.isRepetition()).toBe(true);
  });
});

describe('difficulty levels', () => {
  // Unlimited time so results depend only on depth and seed.
  const level = (name: keyof typeof DIFFICULTY_SEARCH, seed: number): SearchOptions => ({
    ...DIFFICULTY_SEARCH[name],
    timeMs: Infinity,
    seed,
  });
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  const opening = createGameFromArmies(PRESETS[0]!.deployment, PRESETS[0]!.deployment);

  it('Beginner still plays mate in one and takes free material', () => {
    for (const seed of seeds) {
      expect(coords(best(game('7k/6pp/8/8/8/8/8/R5K1 w'), level('beginner', seed)).move)).toBe(
        'a1a8',
      );
      expect(coords(best(game('q3k3/8/8/8/8/8/8/R3K3 w'), level('beginner', seed)).move)).toBe(
        'a1a8',
      );
    }
  });

  it('weaker levels vary their moves between games', () => {
    for (const name of ['beginner', 'intermediate'] as const) {
      const picks = new Set(seeds.map((seed) => coords(best(opening, level(name, seed)).move)));
      expect(picks.size).toBeGreaterThan(1);
    }
  });

  it('never chooses a move worse than the margin allows', () => {
    for (const seed of seeds) {
      const options = level('beginner', seed);
      const top = best(opening, { ...options, margin: 0 }).score;
      expect(best(opening, options).score).toBeGreaterThanOrEqual(top - options.margin!);
    }
  });
});
