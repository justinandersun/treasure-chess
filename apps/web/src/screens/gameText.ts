import type { Color, DrawReason, GameResult } from '@treasure-chess/game';
import { COLOR_NAME } from '../labels';

const DRAW_TEXT: Record<DrawReason, string> = {
  stalemate: 'Stalemate: the player to move has no legal moves but is not in check.',
  'dead-position': 'Neither side has enough pieces left to checkmate.',
  'fivefold-repetition': 'The same position occurred five times.',
  'seventy-five-move-rule': '75 moves each without a capture or infantry move.',
  'threefold-repetition': 'Claimed after the same position occurred three times.',
  'fifty-move-rule': 'Claimed after 50 moves each without a capture or infantry move.',
};

/**
 * Names for each side: colors in a two-player game, or "you" and "the computer" when `player` is
 * the human's color.
 */
export function sideName(color: Color, player?: Color): string {
  if (player === undefined) return COLOR_NAME[color];
  return color === player ? 'You' : 'The computer';
}

export function resultHeadline(result: GameResult, player?: Color): string {
  switch (result.kind) {
    case 'checkmate':
      if (player !== undefined) {
        return result.winner === player ? 'Checkmate — You Win' : 'Checkmate — the Computer Wins';
      }
      return `Checkmate — ${COLOR_NAME[result.winner]} Wins`;
    case 'resignation':
      if (player !== undefined) {
        return result.winner === player ? 'The Computer Resigned' : 'You Resigned';
      }
      return `${COLOR_NAME[result.winner]} Wins by Resignation`;
    case 'draw':
      return 'Draw';
  }
}

export function resultDetail(result: GameResult, player?: Color): string {
  const loser = (winner: Color): Color => (winner === 'w' ? 'b' : 'w');
  switch (result.kind) {
    case 'checkmate': {
      const losing = loser(result.winner);
      if (player === undefined)
        return `${COLOR_NAME[losing]}'s King is in check and cannot escape.`;
      return losing === player
        ? 'Your King is in check and cannot escape.'
        : "The computer's King is in check and cannot escape.";
    }
    case 'resignation':
      return player !== undefined
        ? 'Start a new game or undo to keep playing.'
        : `${COLOR_NAME[loser(result.winner)]} resigned.`;
    case 'draw':
      return DRAW_TEXT[result.reason];
  }
}
