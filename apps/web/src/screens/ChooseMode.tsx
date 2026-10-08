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
      <h1 id="mode-title">New game</h1>
      <p className={styles.lede}>Who are you playing?</p>
      <div className={styles.choices}>
        <button type="button" className={styles.choice} onClick={() => onChoose('local')}>
          <strong>Two players</strong>
          <span>Take turns on this device. Each player drafts in private.</span>
        </button>
        <button type="button" className={styles.choice} onClick={() => onChoose('computer')}>
          <strong>Against the computer</strong>
          <span>You play White against a preset army.</span>
        </button>
      </div>
      <Button variant="quiet" onClick={onBack}>
        Back
      </Button>
    </section>
  );
}
