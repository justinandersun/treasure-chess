import {
  algebraicHistory,
  claimableDraw,
  claimDraw,
  type Color,
  findKing,
  type GameState,
  inCheck,
  opposite,
  PIECES,
  type PieceType,
  playMove,
  resign,
  type Square,
  squareName,
  undo,
} from '@treasure-chess/game';
import { useMemo, useState } from 'react';
import { handleTap, type Selection, selectionMarks } from '../app/playInteraction';
import { Board } from '../components/Board';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { PieceIcon } from '../pieces/PieceIcon';
import { resultDetail, resultHeadline } from './gameText';
import { COLOR_NAME } from './labels';
import { MoveHistory } from './MoveHistory';
import styles from './Play.module.css';

interface PlayProps {
  readonly game: GameState;
  readonly onChange: (game: GameState) => void;
  readonly onNewGame: () => void;
}

type OpenDialog = 'resign' | 'new-game' | null;
interface PendingPromotion {
  readonly from: Square;
  readonly to: Square;
  readonly choices: readonly PieceType[];
}

export function Play({ game, onChange, onNewGame }: PlayProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [orientation, setOrientation] = useState<Color>('w');
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  // The result dialog opens once per finished game state; closing it lets players review.
  const [reviewing, setReviewing] = useState<GameState | null>(null);

  const { board, turn } = game.position;
  const marks = useMemo(() => selectionMarks(game, selection), [game, selection]);
  const check = inCheck(game) ? findKing(board, turn) : null;
  const claim = claimableDraw(game);
  const lastMoveText = useMemo(() => {
    const history = algebraicHistory(game);
    return history.length ? `${COLOR_NAME[opposite(turn)]} played ${history.at(-1)}. ` : '';
  }, [game, turn]);

  function update(next: GameState) {
    setSelection(null);
    setPromotion(null);
    onChange(next);
  }

  function handleSquare(sq: Square) {
    const result = handleTap(game, selection, sq);
    if (result.kind === 'select') setSelection(result.selection);
    else if (result.kind === 'move') update(playMove(game, result.move));
    else setPromotion(result);
  }

  let status: string;
  if (game.result) status = resultHeadline(game.result);
  else status = `${COLOR_NAME[turn]} to move${check !== null ? ' — check!' : ''}`;
  if (!game.result && selection?.mode === 'inspect') {
    const p = board[selection.square]!;
    status = `Inspecting ${COLOR_NAME[p.color]} ${PIECES[p.type].name} on ${squareName(selection.square)}`;
  }

  return (
    <section className={styles.play} aria-label="Game">
      <div className={styles.boardArea}>
        <p className={styles.status} role="status" aria-live="polite">
          <span className="visually-hidden">{lastMoveText}</span>
          <span className={styles.turnDot} data-color={game.result ? undefined : turn} />
          {status}
        </p>
        <Board
          board={board}
          orientation={orientation}
          selected={selection?.square ?? null}
          selectionStyle={selection?.mode === 'inspect' ? 'inspect' : 'select'}
          targets={marks}
          lastMove={game.lastMove}
          checkSquare={check}
          onSquareClick={handleSquare}
        />
      </div>

      <aside className={styles.panel} aria-label="Game controls">
        <div className={styles.controls}>
          <Button onClick={() => update(undo(game))} disabled={!game.previous}>
            Undo
          </Button>
          <Button onClick={() => setOrientation(opposite(orientation))}>Flip board</Button>
          <Button onClick={() => setDialog('resign')} disabled={!!game.result}>
            Resign
          </Button>
          <Button onClick={() => (game.result ? onNewGame() : setDialog('new-game'))}>
            New game
          </Button>
          {claim && (
            <Button
              variant="primary"
              className={styles.wide}
              onClick={() => update(claimDraw(game))}
            >
              Claim draw ({claim === 'threefold-repetition' ? 'repetition' : '50 moves'})
            </Button>
          )}
        </div>
        <h2 className={styles.panelHeading}>Moves</h2>
        <MoveHistory game={game} />
        {game.result && (
          <p className={styles.resultNote}>
            <strong>{resultHeadline(game.result)}.</strong> {resultDetail(game.result)}
          </p>
        )}
      </aside>

      <Dialog
        open={promotion !== null}
        title="Promote to"
        size="small"
        onClose={() => setPromotion(null)}
      >
        <div className={styles.promotions}>
          {promotion?.choices.map((type) => (
            <button
              key={type}
              type="button"
              className={styles.promotion}
              onClick={() =>
                update(playMove(game, { from: promotion.from, to: promotion.to, promotion: type }))
              }
            >
              <PieceIcon type={type} color={turn} />
              <span>{PIECES[type].name}</span>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'resign'}
        title="Resign?"
        size="small"
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            {(['w', 'b'] as const).map((color) => (
              <Button
                key={color}
                onClick={() => {
                  setDialog(null);
                  update(resign(game, color));
                }}
              >
                {COLOR_NAME[color]} resigns
              </Button>
            ))}
          </>
        }
      >
        <p>Either player may resign. The other player wins. You can undo a resignation.</p>
      </Dialog>

      <Dialog
        open={dialog === 'new-game'}
        title="Start a new game?"
        size="small"
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Keep playing
            </Button>
            <Button variant="primary" onClick={onNewGame}>
              New game
            </Button>
          </>
        }
      >
        <p>This game is not finished. Starting a new game will discard it.</p>
      </Dialog>

      <Dialog
        open={game.result !== null && reviewing !== game}
        title={game.result ? resultHeadline(game.result) : ''}
        size="small"
        onClose={() => setReviewing(game)}
        actions={
          <>
            <Button variant="quiet" onClick={() => update(undo(game))}>
              Undo move
            </Button>
            <Button onClick={() => setReviewing(game)}>Review board</Button>
            <Button variant="primary" onClick={onNewGame}>
              New game
            </Button>
          </>
        }
      >
        <p>{game.result && resultDetail(game.result)}</p>
      </Dialog>
    </section>
  );
}
