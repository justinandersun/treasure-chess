import { TREASURY } from '@treasure-chess/game';
import type { Session } from '../app/appState';
import { Button } from '../components/Button';
import { PieceIcon } from '../pieces/PieceIcon';
import { COLOR_NAME } from './labels';
import styles from './Screens.module.css';

interface HomeProps {
  readonly session: Session | null;
  readonly onNewGame: () => void;
  readonly onContinue: () => void;
  readonly onDiscard: () => void;
  readonly onRules: () => void;
}

function describeSession(session: Session): { action: string; detail: string } {
  if (session.kind === 'setup') {
    return { action: 'Continue setup', detail: 'Two players · choosing armies' };
  }
  const { game } = session;
  if (game.result) return { action: 'View last game', detail: 'Two players · finished' };
  const moveNumber = Math.floor(game.ply / 2) + 1;
  return {
    action: 'Continue game',
    detail: `Two players · move ${moveNumber} · ${COLOR_NAME[game.position.turn]} to play`,
  };
}

export function Home({ session, onNewGame, onContinue, onDiscard, onRules }: HomeProps) {
  const saved = session && describeSession(session);
  return (
    <section className={styles.centered} aria-labelledby="home-title">
      <div className={styles.emblem} aria-hidden="true">
        <PieceIcon type="gryphon" color="w" />
        <PieceIcon type="falconer" color="b" />
        <PieceIcon type="elephant" color="w" />
      </div>
      <h1 id="home-title" className={styles.title}>
        Treasure Chess
      </h1>
      <p className={styles.lede}>
        Spend {TREASURY} gold on an army of fairy pieces, arrange it, and play.
      </p>
      <div className={styles.actions}>
        {saved && (
          <Button variant="primary" onClick={onContinue}>
            {saved.action}
          </Button>
        )}
        <Button variant={saved ? 'default' : 'primary'} onClick={onNewGame}>
          New game
        </Button>
        <Button onClick={onRules}>Rules</Button>
      </div>
      {saved && (
        <p className={styles.saved}>
          Saved on this device: {saved.detail}.{' '}
          <button type="button" className={styles.link} onClick={onDiscard}>
            Discard
          </button>
        </p>
      )}
    </section>
  );
}
