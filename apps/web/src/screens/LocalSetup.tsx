import { opposite } from '@treasure-chess/game';
import type { SetupAction, SetupState } from '../app/setup';
import { Draft } from './Draft';
import { Handoff } from './Handoff';
import { COLOR_NAME } from './labels';
import { Place } from './Place';
import { Reveal } from './Reveal';

interface LocalSetupProps {
  readonly setup: SetupState;
  readonly dispatch: (action: SetupAction) => void;
  readonly onStart: () => void;
  readonly onCancel: () => void;
}

/** Renders the current step of a local two-player setup. */
export function LocalSetup({ setup, dispatch, onStart, onCancel }: LocalSetupProps) {
  const { step, color } = setup;
  switch (step) {
    case 'draft':
      return (
        <Draft
          key={color}
          color={color}
          draft={setup.drafts[color]}
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
          draft={setup.drafts[color]}
          deployment={setup.deployments[color]}
          onChange={(deployment) => dispatch({ type: 'set-deployment', deployment })}
          onBack={() => dispatch({ type: 'back-to-draft' })}
          onLock={() => dispatch({ type: 'lock' })}
        />
      );
    case 'handoff':
      return (
        <Handoff
          title={`Pass the device to ${COLOR_NAME[color]}`}
          message={
            setup.resume
              ? `Setup was restored. ${COLOR_NAME[color]}, continue when you are ready to keep building your army in private.`
              : `${COLOR_NAME[opposite(color)]}'s army is locked in and hidden. ${COLOR_NAME[color]}, continue when you are ready to draft in private.`
          }
          action={`I'm ${COLOR_NAME[color]} — continue`}
          onContinue={() => dispatch({ type: 'continue' })}
        />
      );
    case 'ready':
      return (
        <Handoff
          title="Both armies are ready"
          message="Put the device where both players can see it, then reveal the armies together."
          action="Reveal armies"
          onContinue={() => dispatch({ type: 'continue' })}
        />
      );
    case 'reveal':
      return <Reveal white={setup.deployments.w} black={setup.deployments.b} onStart={onStart} />;
  }
}
