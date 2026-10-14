import { deploymentDraft, draftCost, PRESETS } from '@treasure-chess/game';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './ChooseOpponent.module.css';

interface ChooseOpponentProps {
  readonly onChoose: (presetId: string) => void;
}

/** Picks the starter army (and formation) the computer will play. */
export function ChooseOpponent({ onChoose }: ChooseOpponentProps) {
  return (
    <section className={styles.choose} aria-labelledby="opponent-title">
      <h1 id="opponent-title">Choose the Computer’s Army</h1>
      <p className={styles.hint}>The computer plays Black with one of the starter armies.</p>
      <ul className={styles.list}>
        {PRESETS.map((preset) => (
          <li key={preset.id}>
            <button type="button" className={styles.option} onClick={() => onChoose(preset.id)}>
              <span className={styles.name}>
                <strong>{preset.name}</strong>
                <span className={styles.points}>
                  {draftCost(deploymentDraft(preset.deployment))} points
                </span>
              </span>
              <span className={styles.rank} aria-hidden="true">
                {preset.deployment.backRank.map((type, file) => (
                  <span key={file} className={styles.square}>
                    {type && <PieceIcon type={type} color="b" />}
                  </span>
                ))}
              </span>
              <span className={styles.description}>{preset.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
