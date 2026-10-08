import {
  type ArmyDraft,
  type Color,
  createRng,
  type Deployment,
  PIECE_TYPES,
  PIECES,
  type PieceType,
  randomDeployment,
  type Square,
  validateDeployment,
} from '@treasure-chess/game';
import { useMemo, useState } from 'react';
import {
  canPlace,
  deploymentBoard,
  emptyDeployment,
  moveWithin,
  pieceAtSlot,
  placeFromTray,
  removeAt,
  sameSlot,
  type Slot,
  slotSquare,
  squareSlot,
  trayCounts,
} from '../app/placement';
import { Board, type TargetKind } from '../components/Board';
import { Button } from '../components/Button';
import { PieceIcon } from '../pieces/PieceIcon';
import { COLOR_NAME } from './labels';
import styles from './Place.module.css';

type Selection = { kind: 'tray'; type: PieceType } | { kind: 'slot'; slot: Slot } | null;

const ALL_SLOTS: Slot[] = (['back', 'pawn'] as const).flatMap((row) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((file) => ({ row, file })),
);

interface PlaceProps {
  readonly color: Color;
  readonly draft: ArmyDraft;
  readonly deployment: Deployment;
  readonly onChange: (deployment: Deployment) => void;
  readonly onBack: () => void;
  readonly onLock: () => void;
}

export function Place({ color, draft, deployment, onChange, onBack, onLock }: PlaceProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const tray = trayCounts(draft, deployment);
  const remaining = Object.values(tray).reduce((n, c) => n + (c ?? 0), 0);
  const issues = remaining === 0 ? validateDeployment(deployment, draft) : [];

  const targets = useMemo(() => {
    const map = new Map<Square, TargetKind>();
    if (!selection) return map;
    for (const slot of ALL_SLOTS) {
      const occupied = pieceAtSlot(deployment, slot) !== null;
      const ok =
        selection.kind === 'tray'
          ? canPlace(selection.type, slot)
          : !sameSlot(selection.slot, slot) &&
            moveWithin(deployment, selection.slot, slot) !== deployment;
      if (ok) map.set(slotSquare(slot, color), occupied ? 'capture' : 'move');
    }
    return map;
  }, [selection, deployment, color]);

  function change(next: Deployment, nextSelection: Selection = null) {
    onChange(next);
    setSelection(nextSelection);
  }

  function handleSquare(sq: Square) {
    const slot = squareSlot(sq, color);
    if (!slot) return setSelection(null);
    const occupant = pieceAtSlot(deployment, slot);

    if (selection?.kind === 'tray' && canPlace(selection.type, slot)) {
      const next = placeFromTray(deployment, selection.type, slot);
      const left = trayCounts(draft, next)[selection.type] ?? 0;
      return change(next, left > 0 ? selection : null);
    }
    if (selection?.kind === 'slot') {
      if (sameSlot(selection.slot, slot)) return setSelection(null);
      const next = moveWithin(deployment, selection.slot, slot);
      if (next !== deployment) return change(next);
    }
    setSelection(occupant ? { kind: 'slot', slot } : null);
  }

  const selectedSlot = selection?.kind === 'slot' ? selection.slot : null;
  const selectedPiece = selectedSlot ? pieceAtSlot(deployment, selectedSlot) : null;
  const instruction =
    selection?.kind === 'tray'
      ? `Choose a highlighted square for the ${PIECES[selection.type].name}.`
      : selectedPiece
        ? `Choose where to move the ${PIECES[selectedPiece].name}, or return it to the tray.`
        : remaining > 0
          ? 'Choose a piece below, then a highlighted square. Tap a placed piece to move it.'
          : 'All pieces placed. Tap a piece to rearrange, or lock in your army.';

  return (
    <section className={styles.place} aria-labelledby="place-title">
      <h1 id="place-title">{COLOR_NAME[color]}: place your army</h1>
      <p className={styles.instruction} role="status">
        {instruction}
      </p>

      <Board
        board={deploymentBoard(deployment, color)}
        orientation={color}
        selected={selectedSlot ? slotSquare(selectedSlot, color) : null}
        targets={targets}
        onSquareClick={handleSquare}
        label={`${COLOR_NAME[color]} army placement`}
        rows={[6, 7]}
      />

      <div className={styles.tray} role="group" aria-label="Pieces to place">
        {remaining === 0 && <p className={styles.trayEmpty}>Every piece is on the board.</p>}
        {PIECE_TYPES.filter((t) => tray[t]).map((type) => {
          const active = selection?.kind === 'tray' && selection.type === type;
          return (
            <button
              key={type}
              type="button"
              className={[styles.trayPiece, active && styles.active].filter(Boolean).join(' ')}
              aria-pressed={active}
              aria-label={`${PIECES[type].name}, ${tray[type]} to place`}
              onClick={() => setSelection(active ? null : { kind: 'tray', type })}
            >
              <PieceIcon type={type} color={color} />
              {tray[type]! > 1 && <span className={styles.badge}>{tray[type]}</span>}
            </button>
          );
        })}
      </div>

      {issues.length > 0 && (
        <ul className={styles.issues}>
          {issues.map((i) => (
            <li key={i.code}>{i.message}</li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        {selectedSlot && (
          <Button onClick={() => change(removeAt(deployment, selectedSlot))}>Return to tray</Button>
        )}
        <Button onClick={() => change(randomDeployment(draft, createRng(Date.now())))}>
          Random
        </Button>
        <Button onClick={() => change(emptyDeployment())}>Clear</Button>
        <Button variant="quiet" onClick={onBack}>
          Back to draft
        </Button>
        <Button variant="primary" onClick={onLock} disabled={remaining > 0 || issues.length > 0}>
          Lock in army
        </Button>
      </div>
    </section>
  );
}
