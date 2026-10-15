import {
  type Deployment,
  deploymentDraft,
  draftCost,
  formatPosition,
  PRESETS,
  setupPosition,
} from '@treasure-chess/game';
import { useState } from 'react';
import type { GameMode } from '../app/setup';
import { Board } from '../components/Board';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import styles from './Place.module.css';

interface RevealProps {
  readonly white: Deployment;
  readonly black: Deployment;
  readonly mode: GameMode;
  readonly onStart: () => void;
  /** Against the computer: swaps the computer's starter army. */
  readonly onChangeOpponent: (presetId: string) => void;
}

const sameDeployment = (a: Deployment, b: Deployment) => JSON.stringify(a) === JSON.stringify(b);
const points = (d: Deployment) => draftCost(deploymentDraft(d));

/** Both armies on the board, ready to start. */
export function Reveal({ white, black, mode, onStart, onChangeOpponent }: RevealProps) {
  const [choosing, setChoosing] = useState(false);
  const position = setupPosition(white, black);
  const opponent = PRESETS.find((p) => sameDeployment(p.deployment, black));
  return (
    <section className={`${styles.place} ${styles.reveal}`} aria-labelledby="reveal-title">
      <h1 id="reveal-title" className={styles.centered}>
        The Armies
      </h1>
      <p className={`${styles.summary} ${styles.centered}`}>
        {mode === 'computer'
          ? `You (White) spent ${points(white)} points. Computer plays ${opponent?.name ?? 'a starter army'} (${points(black)} points).`
          : `White spent ${points(white)} points; Black spent ${points(black)} points.`}
      </p>
      <Board
        board={position.board}
        orientation="w"
        label={`Starting position: ${formatPosition(position)}`}
      />
      <div className={styles.actions}>
        {mode === 'computer' && <Button onClick={() => setChoosing(true)}>Change Army</Button>}
        <Button variant="primary" onClick={onStart} autoFocus>
          Start Game
        </Button>
      </div>

      <Dialog
        open={choosing}
        title="Computer’s Army"
        size="small"
        onClose={() => setChoosing(false)}
      >
        <ul className={styles.armyList}>
          {PRESETS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.armyOption}
                aria-pressed={p.id === opponent?.id}
                onClick={() => {
                  onChangeOpponent(p.id);
                  setChoosing(false);
                }}
              >
                <span className={styles.armyName}>
                  <strong>{p.name}</strong>
                  <span>{points(p.deployment)} pts</span>
                </span>
                <span className={styles.armyDescription}>{p.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </section>
  );
}
