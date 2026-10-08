import { TREASURY } from '@treasure-chess/game';
import { Button } from '../components/Button';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Screens.module.css';

interface HomeProps {
  readonly onNewGame: () => void;
  readonly onRules: () => void;
  readonly onPreview: () => void;
}

export function Home({ onNewGame, onRules, onPreview }: HomeProps) {
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
        <Button variant="primary" onClick={onNewGame}>
          New game
        </Button>
        <Button onClick={onRules}>Rules</Button>
      </div>
      <p className={styles.note}>
        <button type="button" className={styles.link} onClick={onPreview}>
          Board preview
        </button>{' '}
        — a temporary sandbox for trying the pieces until the full game screens arrive.
      </p>
    </section>
  );
}
