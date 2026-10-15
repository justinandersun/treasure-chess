/**
 * Runs the computer opponent's search off the main thread so the page stays responsive. Receives a
 * saved game, replays it, searches, and posts back the chosen move.
 */

import { deserializeGame, DIFFICULTY_SEARCH, findBestMove } from '@treasure-chess/game';
import type { ThinkRequest, ThinkResponse } from './protocol';

/** The worker's global scope (typed by hand: the DOM and WebWorker type libraries conflict). */
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ThinkRequest>) => void) | null;
  postMessage: (message: ThinkResponse) => void;
};

scope.onmessage = (event) => {
  const { game, difficulty, seed } = event.data;
  const result = findBestMove(deserializeGame(game), { ...DIFFICULTY_SEARCH[difficulty], seed });
  const response: ThinkResponse = result
    ? {
        move: result.move.promotion
          ? { from: result.move.from, to: result.move.to, promotion: result.move.promotion }
          : { from: result.move.from, to: result.move.to },
        score: result.score,
      }
    : { move: null, score: 0 };
  scope.postMessage(response);
};
