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
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { COLOR_NAME } from '../labels';
import styles from './Place.module.css';

type Source = { kind: 'tray'; type: PieceType } | { kind: 'slot'; slot: Slot };
type Selection = Source | null;

/** Pointer travel (px) before a press becomes a drag, so taps still select. */
const DRAG_THRESHOLD = 6;

interface Drag {
  readonly source: Source;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

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

  /** The deployment after putting `source` on `slot`, or null if that is not allowed. */
  function moveTo(source: Source, slot: Slot): Deployment | null {
    if (source.kind === 'tray') {
      return canPlace(source.type, slot) ? placeFromTray(deployment, source.type, slot) : null;
    }
    if (sameSlot(source.slot, slot)) return null;
    const next = moveWithin(deployment, source.slot, slot);
    return next === deployment ? null : next;
  }

  function handleSquare(sq: Square) {
    if (consumeDragClick()) return;
    const slot = squareSlot(sq, color);
    if (!slot) return setSelection(null);
    if (selection?.kind === 'slot' && sameSlot(selection.slot, slot)) return setSelection(null);
    const next = selection && moveTo(selection, slot);
    if (next) {
      // Keep a tray piece selected while copies of it remain, for quick repeated placing.
      const keep = selection.kind === 'tray' && (trayCounts(draft, next)[selection.type] ?? 0) > 0;
      return change(next, keep ? selection : null);
    }
    setSelection(pieceAtSlot(deployment, slot) ? { kind: 'slot', slot } : null);
  }

  // ---- Drag and drop (pointer events, so it works with mouse, pen, and touch) ----
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<{ source: Source; x: number; y: number; size: number } | null>(null);
  const dragged = useRef(false);

  /** After a drag, the browser may still fire a click; swallow it once. */
  function consumeDragClick(): boolean {
    if (!dragged.current) return false;
    dragged.current = false;
    return true;
  }

  function startPress(source: Source, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const size = event.currentTarget.getBoundingClientRect().width;
    press.current = { source, x: event.clientX, y: event.clientY, size };
    dragged.current = false;
  }

  /** Applies a drop at screen point (x, y): onto a square, or back to the tray. */
  const drop = useEffectEvent((source: Source, x: number, y: number) => {
    const target = document.elementFromPoint(x, y);
    const squareEl = target?.closest<HTMLElement>('[data-square]');
    const slot = squareEl ? squareSlot(Number(squareEl.dataset.square), color) : null;
    const next = slot && moveTo(source, slot);
    if (next) return change(next);
    if (source.kind === 'slot' && target?.closest('[data-tray]')) {
      return change(removeAt(deployment, source.slot));
    }
    setSelection(null);
  });

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const p = press.current;
      if (!p) return;
      if (!dragged.current) {
        if (Math.hypot(event.clientX - p.x, event.clientY - p.y) < DRAG_THRESHOLD) return;
        dragged.current = true;
        setSelection(p.source); // highlights the legal drop squares
      }
      setDrag({ source: p.source, x: event.clientX, y: event.clientY, size: p.size });
    }
    function onUp(event: PointerEvent) {
      const p = press.current;
      press.current = null;
      if (!p || !dragged.current) return;
      setDrag(null);
      // Clear the flag if no click follows (e.g. the drop landed on another element).
      setTimeout(() => (dragged.current = false), 0);
      drop(p.source, event.clientX, event.clientY);
    }
    function onCancel() {
      press.current = null;
      dragged.current = false;
      setDrag(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  function pressSquare(sq: Square, event: ReactPointerEvent<HTMLButtonElement>) {
    const slot = squareSlot(sq, color);
    if (slot && pieceAtSlot(deployment, slot)) startPress({ kind: 'slot', slot }, event);
  }

  const dragType =
    drag &&
    (drag.source.kind === 'tray' ? drag.source.type : pieceAtSlot(deployment, drag.source.slot));

  const selectedSlot = selection?.kind === 'slot' ? selection.slot : null;
  const selectedPiece = selectedSlot ? pieceAtSlot(deployment, selectedSlot) : null;
  const instruction =
    selection?.kind === 'tray'
      ? `Drop or tap the ${PIECES[selection.type].name} on a highlighted square.`
      : selectedPiece
        ? `Move the ${PIECES[selectedPiece].name} to a highlighted square, or tap the circle below to return it.`
        : remaining > 0
          ? 'Drag pieces from below onto the highlighted squares, or tap a piece and then a square.'
          : 'All pieces placed. Drag pieces to rearrange them, or choose Done.';

  return (
    <section className={styles.place} aria-labelledby="place-title">
      <h1 id="place-title">Place Your Army</h1>
      <p className={styles.instruction} role="status">
        {instruction}
      </p>

      <Board
        board={deploymentBoard(deployment, color)}
        orientation={color}
        selected={selectedSlot ? slotSquare(selectedSlot, color) : null}
        targets={targets}
        onSquareClick={handleSquare}
        onSquarePointerDown={pressSquare}
        label={`${COLOR_NAME[color]} army placement`}
        rows={[6, 7]}
      />

      <div className={styles.tray} role="group" aria-label="Pieces to place" data-tray>
        {/* A selected (or dragged) placed piece can be sent back by tapping this circle. */}
        {selectedSlot && selectedPiece && (
          <button
            type="button"
            className={styles.returnSpot}
            aria-label={`Return the ${PIECES[selectedPiece].name} to the tray`}
            onClick={() => change(removeAt(deployment, selectedSlot))}
          >
            <PieceIcon type={selectedPiece} color={color} />
          </button>
        )}
        {remaining === 0 && !selectedSlot && (
          <p className={styles.trayEmpty}>Every piece is on the board.</p>
        )}
        {PIECE_TYPES.filter((t) => tray[t]).map((type) => {
          const active = selection?.kind === 'tray' && selection.type === type;
          return (
            <button
              key={type}
              type="button"
              className={[styles.trayPiece, active && styles.active].filter(Boolean).join(' ')}
              aria-pressed={active}
              aria-label={`${PIECES[type].name}, ${tray[type]} to place`}
              onClick={() => {
                if (consumeDragClick()) return;
                setSelection(active ? null : { kind: 'tray', type });
              }}
              onPointerDown={(e) => startPress({ kind: 'tray', type }, e)}
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

      {drag && dragType && (
        <div
          className={styles.ghost}
          style={{ left: drag.x, top: drag.y, width: drag.size, height: drag.size }}
          aria-hidden="true"
        >
          <PieceIcon type={dragType} color={color} />
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="quiet" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => change(randomDeployment(draft, createRng(Date.now())))}>
          Random
        </Button>
        <Button onClick={() => change(emptyDeployment())}>Clear</Button>
        <Button variant="primary" onClick={onLock} disabled={remaining > 0 || issues.length > 0}>
          Done
        </Button>
      </div>
    </section>
  );
}
