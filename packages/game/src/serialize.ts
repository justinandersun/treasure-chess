/**
 * Saving and restoring games as plain JSON. A save holds the starting position and the list of
 * actions taken; restoring replays them, which works because the rules are deterministic.
 */

import { createGame, claimDraw, type GameState, playMove, resign } from './game';
import { parseCoordinate, toCoordinate } from './notation';
import { PIECE_TYPES, type PieceType } from './pieces';
import { formatPosition, parsePosition } from './position';
import type { PromotionTypes } from './rules';

export const SAVED_GAME_VERSION = 1;

/**
 * Each action is a move in coordinate notation (`e2e4`, `e7e8Y`), `resign:w`, `resign:b`, or
 * `claim-draw`.
 */
export interface SavedGame {
  readonly version: typeof SAVED_GAME_VERSION;
  readonly start: string;
  readonly promotionTypes: { readonly w: readonly PieceType[]; readonly b: readonly PieceType[] };
  readonly actions: readonly string[];
}

export class SavedGameError extends Error {
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.name = 'SavedGameError';
  }
}

function actionFor(state: GameState): string {
  if (state.lastMove) return toCoordinate(state.lastMove);
  const result = state.result;
  if (result?.kind === 'resignation') return `resign:${result.winner === 'w' ? 'b' : 'w'}`;
  if (result?.kind === 'draw') return 'claim-draw';
  throw new Error('Unrecognized game action');
}

export function serializeGame(state: GameState): SavedGame {
  const chain: GameState[] = [];
  for (let s: GameState | null = state; s; s = s.previous) chain.push(s);
  chain.reverse();
  const initial = chain[0]!;
  return {
    version: SAVED_GAME_VERSION,
    start: formatPosition(initial.position),
    promotionTypes: {
      w: [...initial.promotionTypes.w],
      b: [...initial.promotionTypes.b],
    },
    actions: chain.slice(1).map(actionFor),
  };
}

const isPieceTypeList = (value: unknown): value is PieceType[] =>
  Array.isArray(value) && value.every((t) => PIECE_TYPES.includes(t as PieceType));

/** Restores a game saved by {@link serializeGame}. Throws {@link SavedGameError} if invalid. */
export function deserializeGame(data: unknown): GameState {
  if (typeof data !== 'object' || data === null) throw new SavedGameError('Not a saved game');
  const saved = data as Partial<Record<keyof SavedGame, unknown>>;
  if (saved.version !== SAVED_GAME_VERSION) {
    throw new SavedGameError(`Unsupported saved game version: ${String(saved.version)}`);
  }
  const types = saved.promotionTypes as Partial<Record<'w' | 'b', unknown>> | undefined;
  if (
    typeof saved.start !== 'string' ||
    !types ||
    !isPieceTypeList(types.w) ||
    !isPieceTypeList(types.b) ||
    !Array.isArray(saved.actions) ||
    !saved.actions.every((a) => typeof a === 'string')
  ) {
    throw new SavedGameError('Saved game is malformed');
  }

  try {
    const promotionTypes: PromotionTypes = { w: types.w, b: types.b };
    let state = createGame({ position: parsePosition(saved.start), promotionTypes });
    for (const action of saved.actions as string[]) {
      if (state.result) throw new Error(`Action after the game ended: ${action}`);
      if (action === 'resign:w' || action === 'resign:b') {
        state = resign(state, action === 'resign:w' ? 'w' : 'b');
      } else if (action === 'claim-draw') {
        state = claimDraw(state);
      } else {
        state = playMove(state, parseCoordinate(action));
      }
    }
    return state;
  } catch (cause) {
    throw new SavedGameError('Saved game could not be replayed', { cause });
  }
}
