import { type Family, PIECE_DEFINITIONS, TREASURY } from '@treasure-chess/game';
import { PieceIcon } from '../pieces/PieceIcon';
import { FAMILY_NAMES } from './labels';
import styles from './RulesContent.module.css';

/** Rules reference. Full rules text and movement diagrams arrive with the Play screen. */
export function RulesContent() {
  const families = Object.keys(FAMILY_NAMES) as Family[];
  return (
    <div className={styles.rules}>
      <p>
        <strong>Draft → Place → Play.</strong> Each player spends up to {TREASURY} gold on an army:
        one King, exactly eight infantry to fill the pawn row, and at least one other piece for the
        back rank. Then place your pieces (the King starts on the d- or e-file) and play chess with
        them. There is no castling or en passant.
      </p>
      <h3>Pieces</h3>
      {families.map((family) => (
        <section key={family} className={styles.family}>
          <h4>{FAMILY_NAMES[family]}</h4>
          <ul className={styles.list}>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => (
              <li key={d.type} className={styles.item}>
                <span className={styles.icons} aria-hidden="true">
                  <PieceIcon type={d.type} color="w" />
                  <PieceIcon type={d.type} color="b" />
                </span>
                <span>
                  <strong>{d.name}</strong>{' '}
                  <span className={styles.meta}>
                    ({d.symbol}) · {d.cost} gold
                  </span>
                  <br />
                  {d.summary}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
