import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface HandoffProps {
  readonly title: string;
  readonly message: string;
  readonly action: string;
  readonly onContinue: () => void;
}

/** A neutral screen shown while the device changes hands, so no army is visible. */
export function Handoff({ title, message, action, onContinue }: HandoffProps) {
  return (
    <section className={styles.centered} aria-labelledby="handoff-title">
      <h1 id="handoff-title">{title}</h1>
      <p className={styles.lede}>{message}</p>
      <Button variant="primary" onClick={onContinue} autoFocus>
        {action}
      </Button>
    </section>
  );
}
