import type { GameMode } from '../app/appState';
import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface SetupPlaceholderProps {
  readonly mode: GameMode;
  readonly onBack: () => void;
  readonly onPreview: () => void;
}

/** Stands in for drafting until it is built. */
export function SetupPlaceholder({ mode, onBack, onPreview }: SetupPlaceholderProps) {
  return (
    <section className={styles.centered} aria-labelledby="setup-title">
      <h1 id="setup-title">{mode === 'local' ? 'Two players' : 'Against the computer'}</h1>
      <p className={styles.lede}>
        Drafting and placement are coming next. Meanwhile, the board preview lets you play preset
        armies against each other.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={onPreview}>
          Open board preview
        </Button>
        <Button variant="quiet" onClick={onBack}>
          Back
        </Button>
      </div>
    </section>
  );
}
