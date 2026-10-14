import {
  type Deployment,
  deploymentDraft,
  draftCost,
  formatPosition,
  setupPosition,
} from '@treasure-chess/game';
import { Board } from '../components/Board';
import { Button } from '../components/Button';
import type { GameMode } from '../app/setup';
import styles from './Place.module.css';

interface RevealProps {
  readonly white: Deployment;
  readonly black: Deployment;
  readonly mode: GameMode;
  readonly onStart: () => void;
}

export function Reveal({ white, black, mode, onStart }: RevealProps) {
  const position = setupPosition(white, black);
  const points = (d: Deployment) => draftCost(deploymentDraft(d));
  return (
    <section className={styles.place} aria-labelledby="reveal-title">
      <h1 id="reveal-title">The Armies</h1>
      <p className={styles.instruction}>
        {mode === 'computer'
          ? `You (White) spent ${points(white)} points; the computer spent ${points(black)}. You move first.`
          : `White spent ${points(white)} points; Black spent ${points(black)} points. White moves first.`}
      </p>
      <Board
        board={position.board}
        orientation="w"
        label={`Starting position: ${formatPosition(position)}`}
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={onStart} autoFocus>
          Start Game
        </Button>
      </div>
    </section>
  );
}
