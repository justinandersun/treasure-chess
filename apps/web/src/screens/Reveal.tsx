import {
  type Deployment,
  deploymentDraft,
  DIFFICULTIES,
  type Difficulty,
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
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_NAMES } from '../labels';
import styles from './Place.module.css';

interface RevealProps {
  readonly white: Deployment;
  readonly black: Deployment;
  readonly mode: GameMode;
  readonly onStart: () => void;
  /** Against the computer: swaps the computer's starter army. */
  readonly onChangeOpponent: (presetId: string) => void;
  /** Against the computer: how strongly it plays, and a way to change that. */
  readonly difficulty: Difficulty;
  readonly onChangeDifficulty: (difficulty: Difficulty) => void;
}

const sameDeployment = (a: Deployment, b: Deployment) => JSON.stringify(a) === JSON.stringify(b);
const points = (d: Deployment) => draftCost(deploymentDraft(d));

/** Both armies on the board, ready to start. */
export function Reveal({
  white,
  black,
  mode,
  onStart,
  onChangeOpponent,
  difficulty,
  onChangeDifficulty,
}: RevealProps) {
  const [choosing, setChoosing] = useState<'army' | 'level' | null>(null);
  const position = setupPosition(white, black);
  const opponent = PRESETS.find((p) => sameDeployment(p.deployment, black));
  return (
    <section className={`${styles.place} ${styles.reveal}`} aria-labelledby="reveal-title">
      <h1 id="reveal-title" className={styles.centered}>
        The Armies
      </h1>
      <p className={`${styles.summary} ${styles.centered}`}>
        {/* Two halves that stay whole where they fit, so a narrow screen wraps at the dot. */}
        <span className={styles.phrase}>
          {mode === 'computer' ? 'You (White)' : 'White'} spent {points(white)} points
        </span>
        <span aria-hidden="true"> · </span>
        <span className="visually-hidden">; </span>
        <span className={styles.phrase}>
          {mode === 'computer'
            ? `${DIFFICULTY_NAMES[difficulty]} Computer plays ${opponent?.name ?? 'a starter army'} (${points(black)} points)`
            : `Black spent ${points(black)} points`}
        </span>
      </p>
      <Board
        board={position.board}
        orientation="w"
        label={`Starting position: ${formatPosition(position)}`}
      />
      <div className={styles.actions}>
        {mode === 'computer' && (
          <>
            <Button onClick={() => setChoosing('army')}>Change Army</Button>
            <Button onClick={() => setChoosing('level')}>Change Level</Button>
          </>
        )}
        <Button variant="primary" onClick={onStart} autoFocus>
          Start Game
        </Button>
      </div>

      <Dialog
        open={choosing === 'army'}
        title="Computer’s Army"
        size="small"
        onClose={() => setChoosing(null)}
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
                  setChoosing(null);
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

      <Dialog
        open={choosing === 'level'}
        title="Computer’s Level"
        size="small"
        onClose={() => setChoosing(null)}
      >
        <ul className={styles.armyList}>
          {DIFFICULTIES.map((level) => (
            <li key={level}>
              <button
                type="button"
                className={styles.armyOption}
                aria-pressed={level === difficulty}
                onClick={() => {
                  onChangeDifficulty(level);
                  setChoosing(null);
                }}
              >
                <span className={styles.armyName}>
                  <strong>{DIFFICULTY_NAMES[level]}</strong>
                </span>
                <span className={styles.armyDescription}>{DIFFICULTY_DESCRIPTIONS[level]}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </section>
  );
}
