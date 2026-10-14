import { opposite } from '@treasure-chess/game';
import { type SetupAction, type SetupState, withKing } from '../app/setup';
import { ChooseOpponent } from './ChooseOpponent';
import { Draft } from './Draft';
import { Handoff } from './Handoff';
import { COLOR_NAME } from '../labels';
import { Place } from './Place';
import { Reveal } from './Reveal';

interface SetupProps {
  readonly setup: SetupState;
  readonly dispatch: (action: SetupAction) => void;
  readonly onStart: () => void;
  readonly onCancel: () => void;
}

/** Renders the current step of army setup, for either game mode. */
export function Setup({ setup, dispatch, onStart, onCancel }: SetupProps) {
  const { step, color, mode } = setup;
  switch (step) {
    case 'draft':
      return (
        <Draft
          key={color}
          color={color}
          mode={mode}
          draft={withKing(setup.drafts[color])}
          onAdjust={(piece, delta) => dispatch({ type: 'adjust-draft', piece, delta })}
          onUsePreset={(presetId) => dispatch({ type: 'use-preset', presetId })}
          onContinue={() => dispatch({ type: 'to-place' })}
          {...(color === 'w' ? { onBack: onCancel } : {})}
        />
      );
    case 'place':
      return (
        <Place
          key={color}
          color={color}
          mode={mode}
          draft={withKing(setup.drafts[color])}
          deployment={setup.deployments[color]}
          onChange={(deployment) => dispatch({ type: 'set-deployment', deployment })}
          onBack={() => dispatch({ type: 'back-to-draft' })}
          onLock={() => dispatch({ type: 'lock' })}
        />
      );
    case 'handoff':
      return (
        <Handoff
          title={`Pass the Device to ${COLOR_NAME[color]}`}
          message={
            setup.resume
              ? `Setup was restored. ${COLOR_NAME[color]}, continue when you are ready to keep building your army in private.`
              : `${COLOR_NAME[opposite(color)]}'s army is placed and hidden. ${COLOR_NAME[color]}, continue when you are ready to draft in private.`
          }
          action="Continue"
          onContinue={() => dispatch({ type: 'continue' })}
        />
      );
    case 'ready':
      return (
        <Handoff
          title="Both Armies Are Ready"
          message="Put the device where both players can see it, then reveal the armies together."
          action="Reveal"
          onContinue={() => dispatch({ type: 'continue' })}
        />
      );
    case 'opponent':
      return (
        <ChooseOpponent onChoose={(presetId) => dispatch({ type: 'choose-opponent', presetId })} />
      );
    case 'reveal':
      return (
        <Reveal
          white={setup.deployments.w}
          black={setup.deployments.b}
          mode={mode}
          onStart={onStart}
        />
      );
  }
}
