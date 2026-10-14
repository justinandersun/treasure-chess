import type { GameMode } from '../app/appState';
import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface ChooseModeProps {
  readonly onChoose: (mode: GameMode) => void;
  readonly onBack: () => void;
}

export function ChooseMode({ onChoose, onBack }: ChooseModeProps) {
  return (
    <section className={styles.centered} aria-labelledby="mode-title">
      <h1 id="mode-title">New Game</h1>
      <div className={styles.choices}>
        <Button variant="primary" onClick={() => onChoose('local')}>
          Human vs. Human
        </Button>
        <Button variant="primary" onClick={() => onChoose('computer')}>
          Human vs. Computer
        </Button>
      </div>
      <Button variant="quiet" onClick={onBack}>
        Back
      </Button>
    </section>
  );
}
