/** Top-level navigation as a small state machine. */

import { createGameFromArmies, type GameState } from '@treasure-chess/game';
import { initialSetup, type SetupAction, setupReducer, type SetupState } from './setup';

export type GameMode = 'local' | 'computer';

export type Screen =
  | { readonly name: 'home' }
  | { readonly name: 'choose-mode' }
  | { readonly name: 'computer-pending' }
  | { readonly name: 'local-setup'; readonly setup: SetupState }
  | { readonly name: 'game'; readonly game: GameState }
  | { readonly name: 'preview' };

export type AppAction =
  | { readonly type: 'go-home' }
  | { readonly type: 'new-game' }
  | { readonly type: 'choose-mode'; readonly mode: GameMode }
  | { readonly type: 'setup'; readonly action: SetupAction }
  | { readonly type: 'start-game' }
  | { readonly type: 'open-preview' };

export const initialScreen: Screen = { name: 'home' };

export function appReducer(screen: Screen, action: AppAction): Screen {
  switch (action.type) {
    case 'go-home':
      return { name: 'home' };
    case 'new-game':
      return { name: 'choose-mode' };
    case 'choose-mode':
      return action.mode === 'local'
        ? { name: 'local-setup', setup: initialSetup() }
        : { name: 'computer-pending' };
    case 'setup':
      if (screen.name !== 'local-setup') return screen;
      return { ...screen, setup: setupReducer(screen.setup, action.action) };
    case 'start-game': {
      if (screen.name !== 'local-setup' || screen.setup.step !== 'reveal') return screen;
      const { w, b } = screen.setup.deployments;
      return { name: 'game', game: createGameFromArmies(w, b) };
    }
    case 'open-preview':
      return { name: 'preview' };
  }
}
