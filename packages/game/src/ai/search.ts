/**
 * The computer opponent's search: iterative-deepening alpha-beta (negamax) with a transposition
 * table, check extensions, quiescence search on captures and promotions, and MVV-LVA / killer move
 * ordering. It stops at a time limit and returns the best move from the deepest finished search.
 * With a `margin`, it instead picks among the near-best moves, which is how weaker levels play.
 */

import type { GameState } from '../game';
import type { Move } from '../movegen';
import { createRng } from '../rng';
import { hashPosition } from '../zobrist';
import { evaluate, PIECE_VALUE } from './evaluate';
import { SearchPosition } from './searchPosition';

export const MATE_SCORE = 100_000;
/** Scores beyond this are forced mates. */
export const MATE_THRESHOLD = MATE_SCORE - 1000;

export interface SearchOptions {
  /** Time budget in milliseconds. Defaults to 1000. */
  readonly timeMs?: number;
  /** Maximum depth in plies. Defaults to 64. */
  readonly maxDepth?: number;
  /** Seed for the small evaluation noise that varies play between games. Defaults to 0. */
  readonly seed?: number;
  /**
   * Centipawns: choose at random (favoring better moves) among moves scoring within this much of
   * the best, instead of always the best. A forced mate is always taken. Defaults to 0.
   */
  readonly margin?: number;
}

export interface SearchResult {
  readonly move: Move;
  /** Centipawns from the moving side's view; ±(MATE_SCORE − plies) for forced mates. */
  readonly score: number;
  /** Depth of the deepest completed iteration. */
  readonly depth: number;
  readonly nodes: number;
}

const TT_BITS = 18;
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;
const EXACT = 1;
const LOWER = 2;
const UPPER = 3;
const MAX_PLY = 96;
const NOISE = 8;

const sameMove = (a: Move | null | undefined, b: Move) =>
  !!a && a.from === b.from && a.to === b.to && a.promotion === b.promotion;

class Stop extends Error {}

class Searcher {
  nodes = 0;
  private readonly deadline: number;
  private readonly ttHi = new Uint32Array(TT_SIZE);
  private readonly ttLo = new Uint32Array(TT_SIZE);
  private readonly ttDepth = new Int8Array(TT_SIZE);
  private readonly ttFlag = new Uint8Array(TT_SIZE);
  private readonly ttScore = new Int32Array(TT_SIZE);
  private readonly ttMove: (Move | null)[] = new Array<Move | null>(TT_SIZE).fill(null);
  private readonly killers: [Move | null, Move | null][] = Array.from({ length: MAX_PLY }, () => [
    null,
    null,
  ]);

  constructor(
    private readonly pos: SearchPosition,
    timeMs: number,
    private readonly seed: number,
  ) {
    this.deadline = Date.now() + timeMs;
  }

  private checkTime() {
    if ((++this.nodes & 1023) === 0 && Date.now() > this.deadline) throw new Stop();
  }

  private score(): number {
    const noise =
      this.seed === 0 ? 0 : (((this.pos.lo ^ this.seed) >>> 0) % (2 * NOISE + 1)) - NOISE;
    return evaluate(this.pos) + noise;
  }

  /** Higher first: hash move, promotions and captures (most valuable victim, cheapest attacker), killers. */
  private order(moves: Move[], ttMove: Move | null, ply: number): Move[] {
    const killers = this.killers[ply] ?? [null, null];
    const rank = (m: Move) => {
      if (sameMove(ttMove, m)) return 1_000_000;
      let s = 0;
      if (m.promotion) s += 500_000 + PIECE_VALUE[m.promotion];
      if (m.captured) s += 100_000 + PIECE_VALUE[m.captured] * 10 - PIECE_VALUE[m.piece] / 10;
      else if (sameMove(killers[0], m)) s += 90_000;
      else if (sameMove(killers[1], m)) s += 80_000;
      return s;
    };
    return moves
      .map((m) => ({ m, s: rank(m) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.m);
  }

  private quiesce(alpha: number, beta: number, ply: number): number {
    this.checkTime();
    const standPat = this.score();
    if (standPat >= beta || ply >= MAX_PLY - 1) return standPat;
    if (standPat > alpha) alpha = standPat;
    const { pos } = this;
    const mover = pos.turn;
    for (const move of this.order(pos.moves(true), null, ply)) {
      pos.make(move);
      if (pos.inCheck(mover)) {
        pos.unmake(move);
        continue;
      }
      const score = -this.quiesce(-beta, -alpha, ply + 1);
      pos.unmake(move);
      if (score >= beta) return score;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  search(depth: number, alpha: number, beta: number, ply: number): number {
    const { pos } = this;
    if (ply > 0 && (pos.isRepetition() || pos.clock >= 100)) return 0;
    if (ply >= MAX_PLY - 1) return this.score();
    const inCheck = pos.inCheck();
    if (inCheck) depth += 1;
    if (depth <= 0) return this.quiesce(alpha, beta, ply);
    this.checkTime();

    const index = pos.lo & TT_MASK;
    const hit = this.ttHi[index] === pos.hi && this.ttLo[index] === pos.lo;
    const ttMove = hit ? this.ttMove[index]! : null;
    if (hit && ply > 0 && this.ttDepth[index]! >= depth) {
      const s = this.ttScore[index]!;
      const flag = this.ttFlag[index];
      if (flag === EXACT || (flag === LOWER && s >= beta) || (flag === UPPER && s <= alpha))
        return s;
    }

    const startAlpha = alpha;
    const mover = pos.turn;
    let best = -Infinity;
    let bestMove: Move | null = null;
    let legal = 0;
    for (const move of this.order(pos.moves(), ttMove, ply)) {
      pos.make(move);
      if (pos.inCheck(mover)) {
        pos.unmake(move);
        continue;
      }
      legal++;
      const score = -this.search(depth - 1, -beta, -alpha, ply + 1);
      pos.unmake(move);
      if (score > best) {
        best = score;
        bestMove = move;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (!move.captured && !move.promotion) {
          const k = this.killers[ply]!;
          if (!sameMove(k[0], move)) this.killers[ply] = [move, k[0]];
        }
        break;
      }
    }

    if (legal === 0) return inCheck ? -MATE_SCORE + ply : 0;

    this.ttHi[index] = pos.hi;
    this.ttLo[index] = pos.lo;
    this.ttDepth[index] = Math.min(depth, 127);
    this.ttScore[index] = best;
    this.ttMove[index] = bestMove;
    this.ttFlag[index] = best <= startAlpha ? UPPER : best >= beta ? LOWER : EXACT;
    return best;
  }

  /** Root search at `depth`, returning the best move and score (or throwing Stop). */
  root(depth: number, moves: Move[]): { move: Move; score: number } {
    const { pos } = this;
    let alpha = -Infinity;
    let bestMove = moves[0]!;
    for (const move of moves) {
      pos.make(move);
      const score = -this.search(depth - 1, -Infinity, -alpha, 1);
      pos.unmake(move);
      if (score > alpha) {
        alpha = score;
        bestMove = move;
      }
    }
    return { move: bestMove, score: alpha };
  }

  /** The exact score of every root move at `depth` (or throws Stop). */
  rootScores(depth: number, moves: Move[]): { move: Move; score: number }[] {
    const { pos } = this;
    return moves.map((move) => {
      pos.make(move);
      const score = -this.search(depth - 1, -Infinity, Infinity, 1);
      pos.unmake(move);
      return { move, score };
    });
  }

  legalRootMoves(): Move[] {
    const { pos } = this;
    const mover = pos.turn;
    return this.order(pos.moves(), null, 0).filter((m) => {
      pos.make(m);
      const ok = !pos.inCheck(mover);
      pos.unmake(m);
      return ok;
    });
  }
}

/** Builds a search position, including the positions since the last irreversible move. */
function searchPositionFor(state: GameState): SearchPosition {
  const history: { lo: number; hi: number }[] = [];
  let s = state.previous;
  for (let i = 0; s && i < state.halfmoveClock; s = s.previous) {
    if (s.lastMove === null && s.previous !== null) continue; // resignation or claim
    history.unshift(hashPosition(s.position.board, s.position.turn));
    i++;
  }
  return new SearchPosition(state.position, state.promotionTypes, history, state.halfmoveClock);
}

/**
 * The computer's choice of move for the side to move, or null if the game is over or there are no
 * legal moves.
 */
export function findBestMove(state: GameState, options: SearchOptions = {}): SearchResult | null {
  if (state.result) return null;
  const { timeMs = 1000, maxDepth = 64, seed = 0, margin = 0 } = options;
  const searcher = new Searcher(searchPositionFor(state), timeMs, seed);
  let moves = searcher.legalRootMoves();
  if (moves.length === 0) return null;

  let best: SearchResult = { move: moves[0]!, score: 0, depth: 0, nodes: 0 };
  if (moves.length === 1) return best;

  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      const { move, score } = searcher.root(depth, moves);
      best = { move, score, depth, nodes: searcher.nodes };
      // Search the best move first next time.
      moves = [move, ...moves.filter((m) => !sameMove(move, m))];
      if (Math.abs(score) >= MATE_THRESHOLD) break;
    } catch (e) {
      if (e instanceof Stop) break;
      throw e;
    }
  }

  if (margin > 0 && best.depth > 0 && Math.abs(best.score) < MATE_THRESHOLD) {
    try {
      const choice = pickNearBest(searcher.rootScores(best.depth, moves), margin, seed);
      best = { ...best, ...choice };
    } catch (e) {
      if (!(e instanceof Stop)) throw e; // out of time: keep the best move
    }
  }
  return { ...best, nodes: searcher.nodes };
}

/** A random choice among moves within `margin` of the best, weighted toward the better ones. */
function pickNearBest(
  scored: readonly { move: Move; score: number }[],
  margin: number,
  seed: number,
): { move: Move; score: number } {
  const top = Math.max(...scored.map((s) => s.score));
  const candidates = scored
    .filter((s) => s.score >= top - margin)
    .map((s) => ({ ...s, weight: margin - (top - s.score) + 1 }));
  let r = createRng(seed)() * candidates.reduce((sum, c) => sum + c.weight, 0);
  for (const c of candidates) {
    r -= c.weight;
    if (r < 0) return c;
  }
  return candidates[0]!;
}
