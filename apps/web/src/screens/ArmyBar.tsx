import { type Color, opposite, PIECES, type PieceType } from '@treasure-chess/game';
import { COLOR_NAME } from '../labels';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './ArmyBar.module.css';

interface ArmyBarProps {
  readonly color: Color;
  /** Point total of this side's pieces still on the board. */
  readonly points: number;
  /** Enemy pieces this side has captured. */
  readonly captured: readonly PieceType[];
}

/** One side's standing, shown beside its king row: points on the board and pieces captured. */
export function ArmyBar({ color, points, captured }: ArmyBarProps) {
  // Most valuable first, so the size of the haul reads at a glance.
  const sorted = [...captured].sort((a, b) => PIECES[b].cost - PIECES[a].cost);
  const capturedText = sorted.length ? sorted.map((t) => PIECES[t].name).join(', ') : 'none';
  return (
    <div className={styles.bar}>
      <span className={styles.side}>{COLOR_NAME[color]}</span>
      <span className={styles.points}>
        {points} {points === 1 ? 'pt' : 'pts'}
      </span>
      <span className="visually-hidden">Captured: {capturedText}.</span>
      <span className={styles.captured} aria-hidden="true">
        {sorted.map((type, i) => (
          <span key={i} className={styles.icon}>
            <PieceIcon type={type} color={opposite(color)} />
          </span>
        ))}
      </span>
    </div>
  );
}
