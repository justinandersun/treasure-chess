import {
  addBlocker,
  type AddBlocker,
  type ArmyDraft,
  type Color,
  deploymentDraft,
  draftCost,
  draftSlots,
  type Family,
  PIECE_DEFINITIONS,
  PIECE_TYPES,
  PIECES,
  type PieceType,
  PRESETS,
  TREASURY,
  validateDraft,
} from '@treasure-chess/game';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { PieceTile } from '../components/PieceTile';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Draft.module.css';
import { FAMILY_NAMES } from '../labels';

/** Why a piece cannot be added, shown when its unavailable "+" is tapped. */
function blockedMessage(blocker: AddBlocker, name: string): string {
  switch (blocker) {
    case 'budget':
      return `Not enough points for a ${name}.`;
    case 'pawn-row-full':
      return 'The pawn row is full.';
    case 'back-rank-full':
      return 'The king row is full.';
    case 'king-limit':
      return 'Every army has exactly one King.';
  }
}

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
  readonly draft: ArmyDraft;
  readonly onAdjust: (piece: PieceType, delta: 1 | -1) => void;
  readonly onLoadStarter: (presetId: string) => void;
  readonly onClear: () => void;
  readonly onContinue: () => void;
  readonly onBack?: () => void;
}

/** Whether two drafts have the same count of every piece type. */
function sameDraft(a: ArmyDraft, b: ArmyDraft): boolean {
  return PIECE_TYPES.every((t) => (a[t] ?? 0) === (b[t] ?? 0));
}

export function Draft({
  color,
  draft,
  onAdjust,
  onLoadStarter,
  onClear,
  onContinue,
  onBack,
}: DraftProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [detail, setDetail] = useState<PieceType | null>(null);
  const spent = draftCost(draft);
  const slots = draftSlots(draft);
  const issues = validateDraft(draft);
  const families = Object.keys(FAMILY_NAMES) as Family[];
  // The starter this draft matches, if it has not been changed.
  const starter = PRESETS.find((p) => sameDraft(deploymentDraft(p.deployment), draft));

  return (
    <section className={styles.draft} aria-labelledby="draft-title">
      <header className={styles.intro}>
        <h1 id="draft-title">Draft Your Army</h1>
        <p className={styles.hint}>
          Build an army of eight infantry and up to seven more pieces, within {TREASURY} points.
          Choose a starter army, edit it, or clear it to build from scratch.
        </p>
        <div className={styles.starter}>
          <label htmlFor="starter-select">Starter Army</label>
          <select
            id="starter-select"
            value={starter?.id ?? 'custom'}
            onChange={(e) => {
              setNotice(null);
              onLoadStarter(e.target.value);
            }}
          >
            {!starter && (
              <option value="custom" disabled>
                Custom
              </option>
            )}
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              setNotice(null);
              onClear();
            }}
          >
            Clear
          </Button>
          <p className={styles.starterDescription}>
            {starter ? starter.description : 'An army of your own design'}
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
                    {/* Tapping a piece shows how it moves, keeping the table short. */}
                    <button
                      type="button"
                      className={styles.piece}
                      aria-haspopup="dialog"
                      onClick={() => setDetail(d.type)}
                    >
                      <span className={styles.icon} aria-hidden="true">
                        <PieceIcon type={d.type} color={color} />
                      </span>
                      <span className={styles.name}>{d.name}</span>
                      <span className={styles.narrowMeta}>
                        · {d.symbol} · {d.cost} {d.cost === 1 ? 'pt' : 'pts'}
                      </span>
                    </button>
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
                          onClick={() => {
                            setNotice(null);
                            onAdjust(d.type, -1);
                          }}
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
                          // Stays focusable and tappable when unavailable, to explain why.
                          aria-disabled={blocker !== null}
                          onClick={() => {
                            if (blocker) return setNotice(blockedMessage(blocker, d.name));
                            setNotice(null);
                            onAdjust(d.type, 1);
                          }}
                          aria-label={`Add ${d.name}`}
                        >
                          +
                        </button>
                      </div>
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
              count={slots.backRank + 1}
              max={8}
              met={slots.backRank >= 1}
            />
          </p>
          <p className={styles.notice} role="status">
            {notice}
          </p>
        </div>
        <div className={styles.actions}>
          {onBack && (
            <Button variant="quiet" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="primary" onClick={onContinue} disabled={issues.length > 0}>
            Next
          </Button>
        </div>
      </footer>

      <Dialog
        open={detail !== null}
        title={detail ? PIECES[detail].name : ''}
        size="small"
        onClose={() => setDetail(null)}
      >
        {detail && <PieceTile type={detail} color={color} as="div" showName={false} />}
      </Dialog>
    </section>
  );
}
