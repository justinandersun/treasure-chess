/**
 * Move notation.
 *
 * - Algebraic (for display), like standard chess: `Nf3`, `exd5`, `Sc3`, `Gxd3`, `Yxe5+`, `e8=Y#`.
 *   Only the Pawn omits its letter; Scouts and Sergeants are written with theirs.
 * - Coordinate (for saving): `e2e4`, or `e7e8Y` with the promotion symbol.
 */

import { fileOf, FILES, parseSquare, rankOf, squareName } from './board';
import { type GameState, inCheck, legalMoves, type MoveInput, playMove } from './game';
import type { Move } from './movegen';
import { PIECES, pieceTypeFromSymbol } from './pieces';

function disambiguation(state: GameState, move: Move): string {
  const rivals = legalMoves(state).filter(
    (m) => m.piece === move.piece && m.to === move.to && m.from !== move.from,
  );
  if (rivals.length === 0) return '';
  const file = FILES[fileOf(move.from)]!;
  const rank = String(rankOf(move.from) + 1);
  if (rivals.every((m) => fileOf(m.from) !== fileOf(move.from))) return file;
  if (rivals.every((m) => rankOf(m.from) !== rankOf(move.from))) return rank;
  return file + rank;
}

/**
 * Algebraic notation for a legal `move` in `state` (before the move is played). Pass `after`, the
 * state the move leads to, if already known.
 */
export function toAlgebraic(state: GameState, move: Move, after = playMove(state, move)): string {
  const capture = move.captured ? 'x' : '';
  const dest = squareName(move.to);
  let text: string;
  if (move.piece === 'pawn') {
    text = (capture ? FILES[fileOf(move.from)]! + capture : '') + dest;
  } else {
    text = PIECES[move.piece].symbol + disambiguation(state, move) + capture + dest;
  }
  if (move.promotion) text += `=${PIECES[move.promotion].symbol}`;

  if (after.result?.kind === 'checkmate') return `${text}#`;
  return inCheck(after) ? `${text}+` : text;
}

/** Algebraic notation for every move played so far, in order. */
export function algebraicHistory(state: GameState): string[] {
  const chain: GameState[] = [];
  for (let s: GameState | null = state; s; s = s.previous) chain.push(s);
  chain.reverse();
  const out: string[] = [];
  for (let i = 1; i < chain.length; i++) {
    const move = chain[i]!.lastMove;
    if (move) out.push(toAlgebraic(chain[i - 1]!, move, chain[i]!));
  }
  return out;
}

/** Coordinate notation: `e2e4`, or `e7e8Y` for a promotion. */
export function toCoordinate(move: MoveInput): string {
  const promotion = move.promotion ? PIECES[move.promotion].symbol : '';
  return `${squareName(move.from)}${squareName(move.to)}${promotion}`;
}

/** Parses coordinate notation. Throws on malformed text; does not check legality. */
export function parseCoordinate(text: string): MoveInput {
  const match = /^([a-h][1-8])([a-h][1-8])([A-Za-z]?)$/.exec(text);
  if (!match) throw new Error(`Invalid move text: ${text}`);
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (!match[3]) return { from, to };
  const promotion = pieceTypeFromSymbol(match[3]);
  if (!promotion) throw new Error(`Unknown promotion piece in: ${text}`);
  return { from, to, promotion };
}
