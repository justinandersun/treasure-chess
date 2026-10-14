import type { MoveInput, SavedGame } from '@treasure-chess/game';

/** Sent to the computer worker: the game so far and how long to think. */
export interface ThinkRequest {
  readonly game: SavedGame;
  readonly timeMs: number;
  readonly seed: number;
}

/** The worker's reply. `move` is null only if the game had already ended. */
export interface ThinkResponse {
  readonly move: MoveInput | null;
  /** Centipawns from the computer's point of view. */
  readonly score: number;
}
