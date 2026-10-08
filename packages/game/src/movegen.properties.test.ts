import { describe, expect, it } from 'vitest';
import { fileOf, makeSquare, opposite, rankOf, type Square } from './board';
import { attackedSquares, type Move, pseudoLegalMovesFrom } from './movegen';
import { PIECES, PIECE_TYPES, piece } from './pieces';
import { type Board, emptyBoard } from './position';
import { seededRandom } from './testing';

function randomBoard(rand: () => number, density: number): Board {
  const board = emptyBoard();
  for (let sq = 0; sq < 64; sq++) {
    if (rand() < density) {
      const type = PIECE_TYPES[Math.floor(rand() * PIECE_TYPES.length)]!;
      board[sq] = piece(type, rand() < 0.5 ? 'w' : 'b');
    }
  }
  return board;
}

/** Maps a board square through `transform`, carrying pieces along (optionally swapping colors). */
function transformBoard(board: Board, transform: (sq: Square) => Square, swap: boolean): Board {
  const out = emptyBoard();
  board.forEach((p, sq) => {
    if (p) out[transform(sq)] = swap ? piece(p.type, opposite(p.color)) : p;
  });
  return out;
}

const flipRanks = (sq: Square) => makeSquare(fileOf(sq), 7 - rankOf(sq));
const flipFiles = (sq: Square) => makeSquare(7 - fileOf(sq), rankOf(sq));

function moveKeys(moves: Move[], transform: (sq: Square) => Square = (sq) => sq): string[] {
  return moves.map((m) => `${transform(m.from)}-${transform(m.to)}-${m.captured ?? ''}`).sort();
}

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

describe('move generation properties (random boards)', () => {
  it('is symmetric between White and Black (rank flip + color swap)', () => {
    for (const seed of SEEDS) {
      const rand = seededRandom(seed);
      const board = randomBoard(rand, 0.3);
      const mirrored = transformBoard(board, flipRanks, true);
      for (let sq = 0; sq < 64; sq++) {
        if (!board[sq]) continue;
        expect(moveKeys(pseudoLegalMovesFrom(mirrored, flipRanks(sq)))).toEqual(
          moveKeys(pseudoLegalMovesFrom(board, sq), flipRanks),
        );
      }
    }
  });

  it('is symmetric left-to-right (file flip)', () => {
    for (const seed of SEEDS) {
      const rand = seededRandom(seed * 7919);
      const board = randomBoard(rand, 0.3);
      const mirrored = transformBoard(board, flipFiles, false);
      for (let sq = 0; sq < 64; sq++) {
        if (!board[sq]) continue;
        expect(moveKeys(pseudoLegalMovesFrom(mirrored, flipFiles(sq)))).toEqual(
          moveKeys(pseudoLegalMovesFrom(board, sq), flipFiles),
        );
      }
    }
  });

  it('never lands on friendly pieces, records captures correctly, and has no duplicates', () => {
    for (const seed of SEEDS) {
      const board = randomBoard(seededRandom(seed * 104729), 0.4);
      for (let sq = 0; sq < 64; sq++) {
        const p = board[sq];
        if (!p) continue;
        const moves = pseudoLegalMovesFrom(board, sq);
        expect(new Set(moves.map((m) => m.to)).size).toBe(moves.length);
        for (const m of moves) {
          expect(m.piece).toBe(p.type);
          const target = board[m.to];
          expect(target?.color).not.toBe(p.color);
          expect(m.captured).toBe(target?.type);
        }
      }
    }
  });

  it('non-infantry move destinations equal attacked squares minus friendly-occupied ones', () => {
    for (const seed of SEEDS) {
      const board = randomBoard(seededRandom(seed * 31337), 0.35);
      for (let sq = 0; sq < 64; sq++) {
        const p = board[sq];
        if (!p || PIECES[p.type].family === 'infantry') continue;
        const dests = pseudoLegalMovesFrom(board, sq)
          .map((m) => m.to)
          .sort((a, b) => a - b);
        const attacked = attackedSquares(board, sq)
          .filter((to) => board[to]?.color !== p.color)
          .sort((a, b) => a - b);
        expect(dests).toEqual(attacked);
      }
    }
  });

  it('infantry captures are always attacked squares', () => {
    for (const seed of SEEDS) {
      const board = randomBoard(seededRandom(seed * 271), 0.4);
      for (let sq = 0; sq < 64; sq++) {
        const p = board[sq];
        if (!p || PIECES[p.type].family !== 'infantry') continue;
        const attacked = new Set(attackedSquares(board, sq));
        for (const m of pseudoLegalMovesFrom(board, sq)) {
          if (m.captured) expect(attacked.has(m.to)).toBe(true);
        }
      }
    }
  });
});
