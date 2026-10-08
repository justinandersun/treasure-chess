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
import { MoveDiagram } from '../components/MoveDiagram';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Draft.module.css';
import { COLOR_NAME, FAMILY_NAMES } from './labels';

const BLOCKER_TEXT: Record<AddBlocker, string> = {
  budget: 'Not enough gold',
  'king-limit': 'Only one King',
  'pawn-row-full': 'Pawn row is full',
  'back-rank-full': 'Back rank is full',
};

interface DraftProps {
  readonly color: Color;
  readonly draft: ArmyDraft;
  readonly onAdjust: (piece: PieceType, delta: 1 | -1) => void;
  readonly onUsePreset: (presetId: string) => void;
  readonly onContinue: () => void;
  readonly onBack?: () => void;
}

export function Draft({ color, draft, onAdjust, onUsePreset, onContinue, onBack }: DraftProps) {
  const [presetId, setPresetId] = useState(PRESETS[0]!.id);
  const spent = draftCost(draft);
  const slots = draftSlots(draft);
  const issues = validateDraft(draft);
  const families = Object.keys(FAMILY_NAMES) as Family[];

  return (
    <section className={styles.draft} aria-labelledby="draft-title">
      <header className={styles.intro}>
        <h1 id="draft-title">{COLOR_NAME[color]}: draft your army</h1>
        <p className={styles.hint}>
          Choose one King, eight infantry for the pawn row, and up to seven more pieces. Your
          opponent will not see your army until both are ready.
        </p>
        <div className={styles.quickStart}>
          <label htmlFor="preset-select">Quick start</label>
          <select id="preset-select" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button onClick={() => onUsePreset(presetId)}>Use preset</Button>
          <p className={styles.presetDescription}>
            {PRESETS.find((p) => p.id === presetId)?.description}
          </p>
        </div>
      </header>

      {families.map((family) => (
        <section key={family} className={styles.family} aria-labelledby={`family-${family}`}>
          <h2 id={`family-${family}`} className={styles.familyName}>
            {FAMILY_NAMES[family]}
          </h2>
          <ul className={styles.list}>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => {
              const count = draft[d.type] ?? 0;
              const blocker = addBlocker(draft, d.type);
              return (
                <li key={d.type} className={styles.row}>
                  <MoveDiagram type={d.type} className={styles.diagram} />
                  <div className={styles.info}>
                    <div className={styles.name}>
                      <span className={styles.icon} aria-hidden="true">
                        <PieceIcon type={d.type} color={color} />
                      </span>
                      <strong>{d.name}</strong>
                      <span className={styles.meta}>
                        {d.symbol} · {d.cost} gold
                      </span>
                    </div>
                    <p className={styles.summary}>{d.summary}</p>
                  </div>
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
                      title={blocker ? BLOCKER_TEXT[blocker] : undefined}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.treasury}>
            <span>
              <strong>{spent}</strong> / {TREASURY} gold · {TREASURY - spent} left
            </span>
            <span
              className={styles.meter}
              role="meter"
              aria-label="Gold spent"
              aria-valuemin={0}
              aria-valuemax={TREASURY}
              aria-valuenow={spent}
            >
              <span style={{ width: `${(Math.min(spent, TREASURY) / TREASURY) * 100}%` }} />
            </span>
          </div>
          <p className={styles.slots}>
            King {draft.king ?? 0}/1 · Pawn row {slots.infantry}/8 · Back rank {slots.backRank}/7
          </p>
          {issues.length > 0 && (
            <p className={styles.issue} aria-live="polite">
              {issues[0]!.message}
              {issues.length > 1 && ` (+${issues.length - 1} more)`}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          {onBack && (
            <Button variant="quiet" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="primary" onClick={onContinue} disabled={issues.length > 0}>
            Place pieces
          </Button>
        </div>
      </footer>
    </section>
  );
}
