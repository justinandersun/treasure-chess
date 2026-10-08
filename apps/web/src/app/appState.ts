/**
 * Top-level app state: which view is showing, plus the one current session (a setup in progress or
 * a game). The session survives going Home, so it can be continued; only starting a new game or
 * discarding replaces it.
 */

import { createGameFromArmies, type GameState } from '@treasure-chess/game';
import { initialSetup, type SetupAction, setupReducer, type SetupState } from './setup';

export type GameMode = 'local' | 'computer';

export type Session =
  | { readonly kind: 'setup'; readonly setup: SetupState }
  | { readonly kind: 'game'; readonly game: GameState };

export type View = 'home' | 'choose-mode' | 'computer-pending' | 'session';

export interface AppState {
  readonly view: View;
  readonly session: Session | null;
}

export type AppAction =
  | { readonly type: 'go-home' }
  | { readonly type: 'new-game' }
  | { readonly type: 'choose-mode'; readonly mode: GameMode }
  | { readonly type: 'continue' }
  | { readonly type: 'discard-session' }
  | { readonly type: 'setup'; readonly action: SetupAction }
  | { readonly type: 'start-game' }
  | { readonly type: 'update-game'; readonly game: GameState };

export const initialAppState: AppState = { view: 'home', session: null };

export function appReducer(state: AppState, action: AppAction): AppState {
  const { session } = state;
  switch (action.type) {
    case 'go-home':
      return { ...state, view: 'home' };
    case 'new-game':
      return { ...state, view: 'choose-mode' };
    case 'choose-mode':
      return action.mode === 'local'
        ? { view: 'session', session: { kind: 'setup', setup: initialSetup() } }
        : { ...state, view: 'computer-pending' };
    case 'continue':
      return session ? { ...state, view: 'session' } : state;
    case 'discard-session':
      return { view: 'home', session: null };
    case 'setup':
      if (session?.kind !== 'setup') return state;
      return {
        ...state,
        session: { kind: 'setup', setup: setupReducer(session.setup, action.action) },
      };
    case 'start-game': {
      if (session?.kind !== 'setup' || session.setup.step !== 'reveal') return state;
      const { w, b } = session.setup.deployments;
      return { ...state, session: { kind: 'game', game: createGameFromArmies(w, b) } };
    }
    case 'update-game':
      return session?.kind === 'game'
        ? { ...state, session: { kind: 'game', game: action.game } }
        : state;
  }
}

/** Whether the session holds work that starting a new game would throw away. */
export function isUnfinished(session: Session | null): boolean {
  if (!session) return false;
  return session.kind === 'setup' || session.game.result === null;
}
