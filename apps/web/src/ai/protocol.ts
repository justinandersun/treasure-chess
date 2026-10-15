import type { Difficulty, MoveInput, SavedGame } from '@treasure-chess/game';

/** Sent to the computer worker: the game so far and how strongly to play. */
export interface ThinkRequest {
  readonly game: SavedGame;
  readonly difficulty: Difficulty;
  readonly seed: number;
}

/** The worker's reply. `move` is null only if the game had already ended. */
export interface ThinkResponse {
  readonly move: MoveInput | null;
  /** Centipawns from the computer's point of view. */
  readonly score: number;
}
