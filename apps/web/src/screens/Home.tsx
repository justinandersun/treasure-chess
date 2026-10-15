import type { GameMode, Session } from '../app/appState';
import { Button } from '../components/Button';
import styles from './Screens.module.css';

interface HomeProps {
  readonly session: Session | null;
  readonly onNewGame: (mode: GameMode) => void;
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
}

/** One line about the saved session, e.g. "vs. Computer · Move 12". */
function describeSession(session: Session): string {
  const mode = session.kind === 'setup' ? session.setup.mode : session.mode;
  const opponent = mode === 'computer' ? 'vs. Computer' : 'vs. Friend';
  if (session.kind === 'setup') return `${opponent} · Drafting`;
  const { game } = session;
  if (game.result) return `${opponent} · Finished`;
  return `${opponent} · Move ${Math.floor(game.ply / 2) + 1}`;
}

export function Home({ session, onNewGame, onContinue, onDiscard }: HomeProps) {
  const saved = session && describeSession(session);
  return (
    <section className={styles.centered} aria-labelledby="home-title">
      <h1 id="home-title" className={styles.title}>
        Treasure Chess
      </h1>
      <p className={styles.lede}>A chess game of asymmetric armies.</p>
      <div className={styles.actions}>
        {saved && (
          <Button variant="primary" onClick={onContinue}>
            Resume Game
          </Button>
        )}
        <Button variant={saved ? 'default' : 'primary'} onClick={() => onNewGame('local')}>
          Play a Friend
        </Button>
        <Button variant={saved ? 'default' : 'primary'} onClick={() => onNewGame('computer')}>
          Play Computer
        </Button>
      </div>
      {saved && (
        <p className={styles.saved}>
          {saved} ·{' '}
          <button type="button" className={styles.link} onClick={onDiscard}>
            Discard
          </button>
        </p>
      )}
    </section>
  );
}
