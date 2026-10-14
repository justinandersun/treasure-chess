import {
  addBlocker,
  type AddBlocker,
  type ArmyDraft,
  type Color,
  draftCost,
  draftSlots,
  type Family,
  PIECE_DEFINITIONS,
  type PieceType,
  PRESETS,
  TREASURY,
  validateDraft,
} from '@treasure-chess/game';
import { useState } from 'react';
import { Button } from '../components/Button';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Draft.module.css';
import type { GameMode } from '../app/setup';
import { COLOR_NAME, FAMILY_NAMES } from '../labels';

const BLOCKER_TEXT: Record<AddBlocker, string> = {
  budget: 'Not enough points',
  'king-limit': 'Only one King',
  'pawn-row-full': 'Pawn row is full',
  'back-rank-full': 'King row is full',
};

/** A footer counter that gains a check mark once its requirement is met. */
function Requirement(props: {
  readonly label: string;
  readonly count: number;
  readonly max: number;
  readonly met: boolean;
}) {
  const { label, count, max, met } = props;
  return (
    <span className={met ? styles.met : undefined}>
      {label} {count}/{max}
      {met && (
        <>
          {' '}
          <span aria-hidden="true">✓</span>
          <span className="visually-hidden">(done)</span>
        </>
      )}
    </span>
  );
}

interface DraftProps {
  readonly color: Color;
  readonly mode: GameMode;
  readonly draft: ArmyDraft;
  readonly onAdjust: (piece: PieceType, delta: 1 | -1) => void;
  readonly onUsePreset: (presetId: string) => void;
  readonly onContinue: () => void;
  readonly onBack?: () => void;
}

export function Draft({
  color,
  mode,
  draft,
  onAdjust,
  onUsePreset,
  onContinue,
  onBack,
}: DraftProps) {
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const spent = draftCost(draft);
  const slots = draftSlots(draft);
  const issues = validateDraft(draft);
  const families = Object.keys(FAMILY_NAMES) as Family[];

  return (
    <section className={styles.draft} aria-labelledby="draft-title">
      <header className={styles.intro}>
        <h1 id="draft-title">
          {mode === 'computer' ? 'Draft Your Army' : `${COLOR_NAME[color]}: Draft Your Army`}
        </h1>
        <p className={styles.hint}>
          Choose eight infantry for the pawn row, and up to seven more pieces for the king row.
        </p>
        <div className={styles.quickStart}>
          <label htmlFor="preset-select">Starter Army</label>
          <select id="preset-select" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button onClick={() => onUsePreset(presetId)}>Use</Button>
          <p className={styles.presetDescription}>
            {PRESETS.find((p) => p.id === presetId)?.description}
          </p>
        </div>
      </header>

      <table className={styles.table}>
        <caption className="visually-hidden">Pieces to draft</caption>
        {families.map((family) => (
          <tbody key={family}>
            <tr>
              {/* The first family's heading row also carries the column headers. */}
              <th
                scope="colgroup"
                colSpan={family === families[0] ? 1 : 4}
                className={`${styles.familyName} section-label`}
              >
                {FAMILY_NAMES[family]}
              </th>
              {family === families[0] && (
                <>
                  <th
                    scope="col"
                    className={`${styles.columnName} ${styles.center} ${styles.wide}`}
                  >
                    Notation
                  </th>
                  <th
                    scope="col"
                    className={`${styles.columnName} ${styles.center} ${styles.wide}`}
                  >
                    Points
                  </th>
                  <th scope="col" className={`${styles.columnName} ${styles.center}`}>
                    Count
                  </th>
                </>
              )}
            </tr>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => {
              const count = draft[d.type] ?? 0;
              const blocker = addBlocker(draft, d.type);
              return (
                <tr key={d.type} className={count > 0 ? styles.chosen : undefined}>
                  <th scope="row" className={styles.pieceCell}>
                    <div className={styles.piece}>
                      <span className={styles.icon} aria-hidden="true">
                        <PieceIcon type={d.type} color={color} />
                      </span>
                      <span className={styles.pieceText}>
                        <span className={styles.name}>
                          {d.name}
                          <span className={styles.narrowMeta}>
                            {' '}
                            · {d.symbol} · {d.cost} {d.cost === 1 ? 'pt' : 'pts'}
                          </span>
                        </span>
                        <span className={styles.summary}>{d.summary}</span>
                      </span>
                    </div>
                  </th>
                  <td className={`${styles.center} ${styles.wide}`}>{d.symbol}</td>
                  <td className={`${styles.center} ${styles.wide}`}>{d.cost}</td>
                  <td>
                    {d.type === 'king' ? (
                      <div className={styles.stepper}>
                        <span className={styles.stepSpacer} />
                        <output className={styles.count} aria-label="King count, always 1">
                          1
                        </output>
                        <span className={styles.stepSpacer} />
                      </div>
                    ) : (
                      <div className={styles.stepper} role="group" aria-label={`${d.name} count`}>
                        <button
                          type="button"
                          className={styles.step}
                          onClick={() => onAdjust(d.type, -1)}
                          disabled={count === 0}
                          aria-label={`Remove ${d.name}`}
                        >
                          −
                        </button>
                        <output className={styles.count} aria-live="polite">
                          {count}
                        </output>
                        <button
                          type="button"
                          className={styles.step}
                          onClick={() => onAdjust(d.type, 1)}
                          disabled={blocker !== null}
                          aria-label={`Add ${d.name}`}
                          aria-describedby={blocker ? `blocked-${d.type}` : undefined}
                        >
                          +
                        </button>
                      </div>
                    )}
                    {blocker && (
                      <p id={`blocked-${d.type}`} className={styles.blocked}>
                        {BLOCKER_TEXT[blocker]}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>

      <footer className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.treasury}>
            <span>
              <strong>{spent}</strong> / {TREASURY} points · {TREASURY - spent} left
            </span>
            <span
              className={styles.meter}
              role="meter"
              aria-label="Points spent"
              aria-valuemin={0}
              aria-valuemax={TREASURY}
              aria-valuenow={spent}
            >
              <span style={{ width: `${(Math.min(spent, TREASURY) / TREASURY) * 100}%` }} />
            </span>
          </div>
          <p className={styles.slots}>
            <Requirement
              label="Pawn Row"
              count={slots.infantry}
              max={8}
              met={slots.infantry === 8}
            />
            {' · '}
            <Requirement
              label="King Row"
              count={slots.backRank}
              max={7}
              met={slots.backRank >= 1}
            />
          </p>
        </div>
        <div className={styles.actions}>
          {onBack && (
            <Button variant="quiet" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="primary" onClick={onContinue} disabled={issues.length > 0}>
            Next: Place
          </Button>
        </div>
      </footer>
    </section>
  );
}
