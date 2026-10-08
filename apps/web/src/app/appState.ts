/** Top-level navigation as a small state machine. Later milestones add draft, place, and play. */

export type GameMode = 'local' | 'computer';

export type Screen =
  | { readonly name: 'home' }
  | { readonly name: 'choose-mode' }
  | { readonly name: 'setup'; readonly mode: GameMode }
  | { readonly name: 'preview' };

export type AppAction =
  | { readonly type: 'go-home' }
  | { readonly type: 'new-game' }
  | { readonly type: 'choose-mode'; readonly mode: GameMode }
  | { readonly type: 'open-preview' };

export const initialScreen: Screen = { name: 'home' };

export function appReducer(_screen: Screen, action: AppAction): Screen {
  switch (action.type) {
    case 'go-home':
      return { name: 'home' };
    case 'new-game':
      return { name: 'choose-mode' };
    case 'choose-mode':
      return { name: 'setup', mode: action.mode };
    case 'open-preview':
      return { name: 'preview' };
  }
}
