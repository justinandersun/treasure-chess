import {
  claimableDraw,
  claimDraw,
  type Color,
  type GameState,
  playMove,
  serializeGame,
} from '@treasure-chess/game';
import { useEffect, useRef } from 'react';
import type { ThinkRequest, ThinkResponse } from './protocol';

/** How long the computer may think per move. */
export const THINK_TIME_MS = 1000;
/** Replies arrive no faster than this, so the computer's move is easy to follow. */
const MIN_REPLY_MS = 450;
/** The computer claims an available draw when it judges itself this far behind (centipawns). */
const CLAIM_DRAW_BELOW = -100;

/**
 * Plays `color`'s moves whenever it is that side's turn. Each search runs in a fresh Web Worker;
 * if the game changes before the reply arrives (undo, new game, leaving the screen), the worker is
 * terminated and its answer discarded.
 */
export function useComputerPlayer(
  game: GameState,
  color: Color | null,
  onChange: (game: GameState) => void,
): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (color === null || game.result || game.position.turn !== color) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const worker = new Worker(new URL('./computer.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<ThinkResponse>) => {
      if (cancelled) return;
      const { move, score } = event.data;
      timer = setTimeout(
        () => {
          if (cancelled || !move) return;
          const claim = claimableDraw(game) !== null && score < CLAIM_DRAW_BELOW;
          onChangeRef.current(claim ? claimDraw(game) : playMove(game, move));
        },
        Math.max(0, MIN_REPLY_MS - (Date.now() - started)),
      );
      worker.terminate();
    };
    worker.onerror = (event) => {
      console.error('Computer player failed:', event.message);
      worker.terminate();
    };

    const request: ThinkRequest = {
      game: serializeGame(game),
      timeMs: THINK_TIME_MS,
      seed: Math.floor(Math.random() * 0x7fffffff) + 1,
    };
    worker.postMessage(request);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      worker.terminate();
    };
  }, [game, color]);
}
