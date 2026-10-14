import type { Session } from '../app/appState';
import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface HomeProps {
  readonly session: Session | null;
  readonly onNewGame: () => void;
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
}

function describeSession(session: Session): { action: string; detail: string } {
  const mode = session.kind === 'setup' ? session.setup.mode : session.mode;
  const opponent = mode === 'computer' ? 'Human vs. Computer' : 'Human vs. Human';
  if (session.kind === 'setup') {
    return { action: 'Continue Setup', detail: `In Progress: ${opponent} · Drafting` };
  }
  const { game } = session;
  if (game.result) return { action: 'View Last Game', detail: `Finished: ${opponent}` };
  const moveNumber = Math.floor(game.ply / 2) + 1;
  return { action: 'Continue Game', detail: `In Progress: ${opponent} · Move ${moveNumber}` };
}

export function Home({ session, onNewGame, onContinue, onDiscard }: HomeProps) {
  const saved = session && describeSession(session);
  return (
    <section className={styles.centered} aria-labelledby="home-title">
      <h1 id="home-title" className={styles.title}>
        Treasure Chess
      </h1>
      <p className={styles.lede}>A game of asymmetric armies.</p>
      <div className={styles.actions}>
        {saved && (
          <Button variant="primary" onClick={onContinue}>
            {saved.action}
          </Button>
        )}
        <Button variant={saved ? 'default' : 'primary'} onClick={onNewGame}>
          New Game
        </Button>
      </div>
      {saved && (
        <p className={styles.saved}>
          {saved.detail} ·{' '}
          <button type="button" className={styles.link} onClick={onDiscard}>
            Discard
          </button>
        </p>
      )}
    </section>
  );
}
