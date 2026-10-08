import {
  type Color,
  createGameFromArmies,
  findKing,
  type GameResult,
  type GameState,
  inCheck,
  legalMovesFrom,
  playMove,
  PRESETS,
  type Square,
  undo,
} from '@treasure-chess/game';
import { useMemo, useState } from 'react';
import { Board, type TargetKind } from '../components/Board';
import { Button } from '../components/Button';
import { COLOR_NAME } from './labels';
import styles from './Preview.module.css';

function startGame(whiteId: string, blackId: string): GameState {
  const find = (id: string) => (PRESETS.find((p) => p.id === id) ?? PRESETS[0]!).deployment;
  return createGameFromArmies(find(whiteId), find(blackId));
}

function describeResult(result: GameResult): string {
  switch (result.kind) {
    case 'checkmate':
      return `Checkmate — ${COLOR_NAME[result.winner]} wins.`;
    case 'resignation':
      return `${COLOR_NAME[result.winner]} wins by resignation.`;
    case 'draw':
      return `Draw (${result.reason.replaceAll('-', ' ')}).`;
  }
}

interface PreviewProps {
  /** A game to play; without one, preset armies can be chosen. */
  readonly initialGame?: GameState;
  readonly onBack: () => void;
}

/**
 * Temporary play view: click to move. Promotions pick the first eligible piece. Replaced by the
 * real Play screen in a later milestone.
 */
export function Preview({ initialGame, onBack }: PreviewProps) {
  const [whiteId, setWhiteId] = useState('menagerie');
  const [blackId, setBlackId] = useState('cavalry');
  const [game, setGame] = useState(() => initialGame ?? startGame(whiteId, blackId));
  const [selected, setSelected] = useState<Square | null>(null);
  const [orientation, setOrientation] = useState<Color>('w');

  const { board, turn } = game.position;
  const moves = useMemo(
    () => (selected === null ? [] : legalMovesFrom(game, selected)),
    [game, selected],
  );
  const targets = useMemo(
    () => new Map<Square, TargetKind>(moves.map((m) => [m.to, m.captured ? 'capture' : 'move'])),
    [moves],
  );
  const check = inCheck(game) ? findKing(board, turn) : null;

  function reset(white = whiteId, black = blackId) {
    setGame(initialGame ?? startGame(white, black));
    setSelected(null);
  }

  function handleSquare(sq: Square) {
    const move = moves.find((m) => m.to === sq);
    if (move) {
      setGame(playMove(game, move));
      setSelected(null);
    } else if (board[sq]?.color === turn && sq !== selected && !game.result) {
      setSelected(sq);
    } else {
      setSelected(null);
    }
  }

  const status = game.result
    ? describeResult(game.result)
    : `${COLOR_NAME[turn]} to move${check !== null ? ' — check!' : ''}`;

  return (
    <section className={styles.preview} aria-labelledby="preview-title">
      <div className={styles.toolbar}>
        <h1 id="preview-title" className={styles.heading}>
          {initialGame ? 'Game' : 'Board preview'}
        </h1>
        {!initialGame && (
          <>
            <label>
              White{' '}
              <select
                value={whiteId}
                onChange={(e) => {
                  setWhiteId(e.target.value);
                  reset(e.target.value, blackId);
                }}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Black{' '}
              <select
                value={blackId}
                onChange={(e) => {
                  setBlackId(e.target.value);
                  reset(whiteId, e.target.value);
                }}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <p className={styles.status} role="status">
        {status}
      </p>

      <Board
        board={board}
        orientation={orientation}
        selected={selected}
        targets={targets}
        lastMove={game.lastMove}
        checkSquare={check}
        onSquareClick={handleSquare}
      />

      <div className={styles.controls}>
        <Button
          onClick={() => {
            setGame(undo(game));
            setSelected(null);
          }}
          disabled={!game.previous}
        >
          Undo
        </Button>
        <Button onClick={() => setOrientation(orientation === 'w' ? 'b' : 'w')}>Flip board</Button>
        <Button onClick={() => reset()}>Restart</Button>
        <Button variant="quiet" onClick={onBack}>
          Home
        </Button>
      </div>
    </section>
  );
}
