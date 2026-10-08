/**
 * Army setup for a local two-player game: each player drafts and places privately, the device is
 * handed over between them, and both armies are revealed together.
 *
 *   White draft ⇄ White place → handoff → Black draft ⇄ Black place → ready → reveal
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
  /** Pass the device to `color` (who has not seen the other army). */
  | 'handoff'
  /** Both armies are locked; waiting to reveal. */
  | 'ready'
  /** Both armies are shown; the game can start. */
  | 'reveal';

export interface SetupState {
  readonly step: SetupStep;
  readonly color: Color;
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
  | { readonly type: 'continue' };

export function initialSetup(): SetupState {
  return {
    step: 'draft',
    color: 'w',
    drafts: { w: {}, b: {} },
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
  const draft = state.drafts[state.color];
  const deployment = state.deployments[state.color];
  switch (action.type) {
    case 'set-draft':
      return state.step === 'draft' ? update(state, 'drafts', action.draft) : state;

    case 'adjust-draft':
      if (state.step !== 'draft') return state;
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
        ...update(state, 'deployments', reconcileDeployment(draft, deployment)),
        step: 'place',
      };

    case 'back-to-draft':
      return state.step === 'place' ? { ...state, step: 'draft' } : state;

    case 'set-deployment':
      return state.step === 'place' ? update(state, 'deployments', action.deployment) : state;

    case 'lock':
      if (state.step !== 'place' || validateDeployment(deployment, draft).length > 0) return state;
      return state.color === 'w'
        ? { ...state, step: 'handoff', color: 'b' }
        : { ...state, step: 'ready' };

    case 'continue':
      if (state.step === 'handoff') return { ...state, step: 'draft' };
      if (state.step === 'ready') return { ...state, step: 'reveal' };
      return state;
  }
}
