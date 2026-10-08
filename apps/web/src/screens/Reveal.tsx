import {
  type Deployment,
  deploymentDraft,
  draftCost,
  formatPosition,
  setupPosition,
} from '@treasure-chess/game';
import { Board } from '../components/Board';
import { Button } from '../components/Button';
import styles from './Place.module.css';

interface RevealProps {
  readonly white: Deployment;
  readonly black: Deployment;
  readonly onStart: () => void;
}

export function Reveal({ white, black, onStart }: RevealProps) {
  const position = setupPosition(white, black);
  const gold = (d: Deployment) => draftCost(deploymentDraft(d));
  return (
    <section className={styles.place} aria-labelledby="reveal-title">
      <h1 id="reveal-title">The armies</h1>
      <p className={styles.instruction}>
        White spent {gold(white)} gold; Black spent {gold(black)} gold. White moves first.
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
