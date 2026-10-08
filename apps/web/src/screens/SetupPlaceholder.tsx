import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface SetupPlaceholderProps {
  readonly onBack: () => void;
  readonly onPreview: () => void;
}

/** Stands in for the computer opponent until it is built. */
export function SetupPlaceholder({ onBack, onPreview }: SetupPlaceholderProps) {
  return (
    <section className={styles.centered} aria-labelledby="setup-title">
      <h1 id="setup-title">Against the computer</h1>
      <p className={styles.lede}>
        The computer opponent is coming in a later update. Meanwhile, try a two-player game or the
        board preview.
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
