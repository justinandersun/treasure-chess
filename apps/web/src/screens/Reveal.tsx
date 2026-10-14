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
  const gold = (d: Deployment) => draftCost(deploymentDraft(d));
  return (
    <section className={styles.place} aria-labelledby="reveal-title">
      <h1 id="reveal-title">The armies</h1>
      <p className={styles.instruction}>
        {mode === 'computer'
          ? `You (White) spent ${gold(white)} gold; the computer spent ${gold(black)}. You move first.`
          : `White spent ${gold(white)} gold; Black spent ${gold(black)} gold. White moves first.`}
      </p>
      <Board
        board={position.board}
        orientation="w"
        label={`Starting position: ${formatPosition(position)}`}
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={onStart} autoFocus>
          Start game
        </Button>
      </div>
    </section>
  );
}
