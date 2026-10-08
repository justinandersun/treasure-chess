import type { DrawReason, GameResult } from '@treasure-chess/game';
import { COLOR_NAME } from './labels';

const DRAW_TEXT: Record<DrawReason, string> = {
  stalemate: 'Stalemate: the player to move has no legal moves but is not in check.',
  'dead-position': 'Neither side has enough material left to checkmate.',
  'fivefold-repetition': 'The same position occurred five times.',
  'seventy-five-move-rule': '75 moves each without a capture or infantry move.',
  'threefold-repetition': 'Claimed after the same position occurred three times.',
  'fifty-move-rule': 'Claimed after 50 moves each without a capture or infantry move.',
};

export function resultHeadline(result: GameResult): string {
  switch (result.kind) {
    case 'checkmate':
      return `Checkmate — ${COLOR_NAME[result.winner]} wins`;
    case 'resignation':
      return `${COLOR_NAME[result.winner]} wins by resignation`;
    case 'draw':
      return 'Draw';
  }
}

export function resultDetail(result: GameResult): string {
  switch (result.kind) {
    case 'checkmate':
      return `${COLOR_NAME[result.winner === 'w' ? 'b' : 'w']}'s King is in check and cannot escape.`;
    case 'resignation':
      return `${COLOR_NAME[result.winner === 'w' ? 'b' : 'w']} resigned.`;
    case 'draw':
      return DRAW_TEXT[result.reason];
  }
}
