import { type Family, PIECE_DEFINITIONS } from '@treasure-chess/game';
import { PieceGrid, PieceTile } from '../components/PieceTile';
import { FAMILY_NAMES } from '../labels';
import styles from './PiecesContent.module.css';

export function PiecesContent() {
  const families = Object.keys(FAMILY_NAMES) as Family[];
  return (
    <div className={styles.pieces}>
      <p className={styles.legend}>
        Diagrams show a piece on an empty board: <span aria-hidden="true">●</span> moves or
        captures, <span aria-hidden="true">○</span> moves only, <span aria-hidden="true">×</span>{' '}
        captures only.
      </p>
      {families.map((family) => (
        <section key={family} aria-labelledby={`pieces-${family}`}>
          <h3 id={`pieces-${family}`} className={`${styles.family} section-label`}>
            {FAMILY_NAMES[family]}
          </h3>
          <PieceGrid>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => (
              <PieceTile key={d.type} type={d.type} color="w" level={4} />
            ))}
          </PieceGrid>
        </section>
      ))}
    </div>
  );
}
