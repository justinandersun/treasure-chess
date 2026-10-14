/**
 * Army setup before a game.
 *
 * Two players: each drafts and places privately, the device is handed over between them, and both
 * armies are revealed together.
 *
 *   White draft ⇄ White place → handoff → Black draft ⇄ Black place → ready → reveal
 *
 * Against the computer: the player (White) builds an army, then picks the computer's preset.
 *
 *   White draft ⇄ White place → opponent → reveal
 */

import {
  addBlocker,
  adjustDraft,
  type ArmyDraft,
  type Color,
  type Deployment,
  deploymentDraft,
  findPreset,
  type PieceType,
  validateDeployment,
  validateDraft,
} from '@treasure-chess/game';
import { emptyDeployment, reconcileDeployment } from './placement';

export type SetupStep =
  /** `color` is choosing pieces. */
  | 'draft'
  /** `color` is arranging pieces. */
  | 'place'
  /** Pass the Device to `color` (who has not seen the other army). */
  | 'handoff'
  /** Both armies are locked; waiting to reveal. */
  | 'ready'
  /** Against the computer: choosing the computer's starter army. */
  | 'opponent'
  /** Both armies are shown; the game can start. */
  | 'reveal';

export type GameMode = 'local' | 'computer';

/** The computer always plays Black. */
export const COMPUTER_COLOR: Color = 'b';

export interface SetupState {
  readonly mode: GameMode;
  readonly step: SetupStep;
  readonly color: Color;
  /** For a handoff: the private step `color` returns to (defaults to drafting). */
  readonly resume?: 'draft' | 'place';
  readonly drafts: Readonly<Record<Color, ArmyDraft>>;
  readonly deployments: Readonly<Record<Color, Deployment>>;
}

export type SetupAction =
  | { readonly type: 'set-draft'; readonly draft: ArmyDraft }
  /** Adds (+1) or removes (−1) one piece, if the army rules allow it. */
  | { readonly type: 'adjust-draft'; readonly piece: PieceType; readonly delta: 1 | -1 }
  | { readonly type: 'use-preset'; readonly presetId: string }
  | { readonly type: 'to-place' }
  | { readonly type: 'back-to-draft' }
  | { readonly type: 'set-deployment'; readonly deployment: Deployment }
  | { readonly type: 'lock' }
  | { readonly type: 'continue' }
  | { readonly type: 'choose-opponent'; readonly presetId: string };

/** Every army has exactly one King, so drafts always include it and it cannot be changed. */
export function withKing(draft: ArmyDraft): ArmyDraft {
  return draft.king === 1 ? draft : { ...draft, king: 1 };
}

export function initialSetup(mode: GameMode = 'local'): SetupState {
  return {
    mode,
    step: 'draft',
    color: 'w',
    drafts: { w: { king: 1 }, b: { king: 1 } },
    deployments: { w: emptyDeployment(), b: emptyDeployment() },
  };
}

function update<K extends 'drafts' | 'deployments'>(
  state: SetupState,
  key: K,
  value: SetupState[K][Color],
): SetupState {
  return { ...state, [key]: { ...state[key], [state.color]: value } };
}

/** Actions that do not apply to the current step leave the state unchanged. */
export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  const draft = withKing(state.drafts[state.color]);
  const deployment = state.deployments[state.color];
  switch (action.type) {
    case 'set-draft':
      return state.step === 'draft' ? update(state, 'drafts', withKing(action.draft)) : state;

    case 'adjust-draft':
      if (state.step !== 'draft' || action.piece === 'king') return state;
      if (action.delta > 0 && addBlocker(draft, action.piece)) return state;
      return update(state, 'drafts', adjustDraft(draft, action.piece, action.delta));

    case 'use-preset': {
      const preset = findPreset(action.presetId);
      if (state.step !== 'draft' || !preset) return state;
      const next = update(state, 'drafts', deploymentDraft(preset.deployment));
      return { ...update(next, 'deployments', preset.deployment), step: 'place' };
    }

    case 'to-place':
      if (state.step !== 'draft' || validateDraft(draft).length > 0) return state;
      return {
        ...update(
          update(state, 'drafts', draft),
          'deployments',
          reconcileDeployment(draft, deployment),
        ),
        step: 'place',
      };

    case 'back-to-draft':
      return state.step === 'place' ? { ...state, step: 'draft' } : state;

    case 'set-deployment':
      return state.step === 'place' ? update(state, 'deployments', action.deployment) : state;

    case 'lock':
      if (state.step !== 'place' || validateDeployment(deployment, draft).length > 0) return state;
      if (state.mode === 'computer') return { ...state, step: 'opponent' };
      return state.color === 'w'
        ? { ...state, step: 'handoff', color: 'b' }
        : { ...state, step: 'ready' };

    case 'choose-opponent': {
      const preset = findPreset(action.presetId);
      if (state.step !== 'opponent' || !preset) return state;
      return {
        ...state,
        step: 'reveal',
        drafts: { ...state.drafts, b: deploymentDraft(preset.deployment) },
        deployments: { ...state.deployments, b: preset.deployment },
      };
    }

    case 'continue':
      if (state.step === 'handoff') {
        const { resume, ...rest } = state;
        return { ...rest, step: resume ?? 'draft' };
      }
      if (state.step === 'ready') return { ...state, step: 'reveal' };
      return state;
  }
}

/**
 * The state to show after a reload. A player who was drafting or placing goes back behind a
 * handoff screen, so whoever holds the device cannot see that army until the player continues.
 */
export function gateAfterReload(state: SetupState): SetupState {
  if (state.mode === 'computer' || (state.step !== 'draft' && state.step !== 'place')) return state;
  return { ...state, step: 'handoff', resume: state.step };
}
