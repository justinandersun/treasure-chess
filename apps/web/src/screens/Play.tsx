import {
  algebraicHistory,
  capturedPieces,
  claimableDraw,
  claimDraw,
  type Color,
  findKing,
  type GameState,
  inCheck,
  initialState,
  material,
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
import type { GameMode } from '../app/appState';
import {
  handleTap,
  type Selection,
  selectionMarks,
  undoToPlayerTurn,
} from '../app/playInteraction';
import { COMPUTER_COLOR } from '../app/setup';
import { useComputerPlayer } from '../ai/useComputerPlayer';
import { Board } from '../components/Board';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { PieceTile } from '../components/PieceTile';
import { PieceIcon } from '../pieces/PieceIcon';
import { PIECE_COLORS } from '../pieces/pieceArt';
import { resultDetail, resultHeadline, sideName } from './gameText';
import { COLOR_NAME } from '../labels';
import { ArmyBar } from './ArmyBar';
import { MoveHistory } from './MoveHistory';
import styles from './Play.module.css';

interface PlayProps {
  readonly game: GameState;
  readonly mode: GameMode;
  readonly onChange: (game: GameState) => void;
  readonly onNewGame: () => void;
}

type OpenDialog = 'resign' | 'new-game' | null;
interface PendingPromotion {
  readonly from: Square;
  readonly to: Square;
  readonly choices: readonly PieceType[];
}

export function Play({ game, mode, onChange, onNewGame }: PlayProps) {
  // Against the computer the person plays White; in a two-player game they play both sides.
  const computer = mode === 'computer' ? COMPUTER_COLOR : null;
  const player = computer ? opposite(computer) : undefined;
  useComputerPlayer(game, computer, onChange);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [orientation, setOrientation] = useState<Color>('w');
  const [promotion, setPromotion] = useState<PendingPromotion | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  // The result dialog opens once per finished game state; closing it lets players review.
  const [reviewing, setReviewing] = useState<GameState | null>(null);

  const { board, turn } = game.position;
  const marks = useMemo(() => selectionMarks(game, selection), [game, selection]);
  const check = inCheck(game) ? findKing(board, turn) : null;
  const thinking = computer !== null && turn === computer && !game.result;
  // Only the player whose turn it is may claim; the computer decides its own claims.
  const claim = thinking ? null : claimableDraw(game);
  const undone = computer ? undoToPlayerTurn(game, opposite(computer)) : undo(game);
  const points = material(game.position);
  const captured = useMemo(() => capturedPieces(game), [game]);
  const selectedPiece = selection ? board[selection.square] : null;
  const rematch = () => update(initialState(game));
  const armyBar = (color: Color) => (
    <ArmyBar color={color} points={points[color]} captured={captured[color]} />
  );
  const lastMoveText = useMemo(() => {
    const history = algebraicHistory(game);
    return history.length ? `${sideName(opposite(turn), player)} played ${history.at(-1)}. ` : '';
  }, [game, turn, player]);

  function update(next: GameState) {
    setSelection(null);
    setPromotion(null);
    onChange(next);
  }

  function handleSquare(sq: Square) {
    const result = handleTap(game, selection, sq, player);
    if (result.kind === 'select') setSelection(result.selection);
    else if (result.kind === 'move') update(playMove(game, result.move));
    else setPromotion(result);
  }

  let status: string;
  if (game.result) status = resultHeadline(game.result, player);
  else if (thinking) status = `The computer is thinking…${check !== null ? ' (in check)' : ''}`;
  else if (player) status = `Your move${check !== null ? ' — check!' : ''}`;
  else status = `${COLOR_NAME[turn]} to move${check !== null ? ' — check!' : ''}`;
  if (!game.result && selection?.mode === 'inspect') {
    const p = board[selection.square]!;
    status = `${COLOR_NAME[p.color]} ${PIECES[p.type].name} on ${squareName(selection.square)}`;
  }

  return (
    <section className={styles.play} aria-label="Game">
      <div className={styles.boardArea}>
        <p className={styles.status} role="status" aria-live="polite">
          <span className="visually-hidden">{lastMoveText}</span>
          <span
            className={[styles.turnDot, thinking && styles.thinking].filter(Boolean).join(' ')}
            data-color={game.result ? undefined : turn}
            style={
              game.result
                ? undefined
                : { background: PIECE_COLORS[turn].body, borderColor: PIECE_COLORS[turn].edge }
            }
          />
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
          above={armyBar(opposite(orientation))}
          below={armyBar(orientation)}
        />
      </div>

      <aside className={styles.panel} aria-label="Game controls">
        <div className={styles.controls}>
          <Button onClick={() => update(undone)} disabled={undone === game}>
            Undo
          </Button>
          <Button onClick={() => setOrientation(opposite(orientation))}>Flip Board</Button>
          <Button onClick={() => setDialog('resign')} disabled={!!game.result}>
            Resign
          </Button>
          <Button onClick={() => (game.result ? onNewGame() : setDialog('new-game'))}>
            New Game
          </Button>
          {game.result && (
            <Button variant="primary" className={styles.wide} onClick={rematch}>
              Rematch
            </Button>
          )}
          {claim && (
            <Button
              variant="primary"
              className={styles.wide}
              onClick={() => update(claimDraw(game))}
            >
              Claim Draw ({claim === 'threefold-repetition' ? 'Repetition' : '50 Moves'})
            </Button>
          )}
        </div>
        {selectedPiece && (
          <PieceTile type={selectedPiece.type} color={selectedPiece.color} as="div" />
        )}
        <h2 className={`${styles.panelHeading} section-label`}>Moves</h2>
        <MoveHistory game={game} />
        {game.result && (
          <p className={styles.resultNote}>
            <strong>{resultHeadline(game.result, player)}.</strong>{' '}
            {resultDetail(game.result, player)}
          </p>
        )}
      </aside>

      <Dialog
        open={promotion !== null}
        title="Choose a Promotion"
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
            {(player ? [player] : (['w', 'b'] as const)).map((color) => (
              <Button
                key={color}
                onClick={() => {
                  setDialog(null);
                  update(resign(game, color));
                }}
              >
                {player ? 'Resign' : `${COLOR_NAME[color]} Resigns`}
              </Button>
            ))}
          </>
        }
      >
        <p>
          {player
            ? 'The computer wins if you resign. You can undo a resignation.'
            : 'Either player may resign. The other player wins. You can undo a resignation.'}
        </p>
      </Dialog>

      <Dialog
        open={dialog === 'new-game'}
        title="Start a New Game?"
        size="small"
        onClose={() => setDialog(null)}
        actions={
          <>
            <Button variant="quiet" onClick={() => setDialog(null)}>
              Keep Playing
            </Button>
            <Button variant="primary" onClick={onNewGame}>
              New Game
            </Button>
          </>
        }
      >
        <p>This game is not finished. Starting a new game will discard it.</p>
      </Dialog>

      <Dialog
        open={game.result !== null && reviewing !== game}
        title={game.result ? resultHeadline(game.result, player) : ''}
        size="small"
        onClose={() => setReviewing(game)}
        actions={
          <>
            <Button variant="quiet" onClick={() => update(undone)} disabled={undone === game}>
              Undo Move
            </Button>
            <Button onClick={() => setReviewing(game)}>Review Board</Button>
            <Button onClick={onNewGame}>New Game</Button>
            <Button variant="primary" onClick={rematch}>
              Rematch
            </Button>
          </>
        }
      >
        <p>{game.result && resultDetail(game.result, player)}</p>
      </Dialog>
    </section>
  );
}
