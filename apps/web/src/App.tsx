import { useEffect, useReducer, useState } from 'react';
import styles from './App.module.css';
import {
  appReducer,
  type AppState,
  type GameMode,
  initialAppState,
  isUnfinished,
} from './app/appState';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { ThemeToggle } from './components/ThemeToggle';
import { browserStorage, loadSession, saveSession } from './persistence/session';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { PiecesContent } from './screens/PiecesContent';
import { RulesContent } from './screens/RulesContent';
import { Setup } from './screens/Setup';

const storage = browserStorage();

/** Restores the saved session, noting if one had to be thrown away. */
function initialize(): { state: AppState; notice: string | null } {
  const loaded = loadSession(storage);
  if (loaded.status === 'restored') return { state: loaded.state, notice: null };
  return {
    state: initialAppState,
    notice: loaded.status === 'discarded' ? `${loaded.reason} A new session was started.` : null,
  };
}

export function App() {
  const [boot] = useState(initialize);
  const [state, dispatch] = useReducer(appReducer, boot.state);
  const [notice, setNotice] = useState(boot.notice);
  const [overlay, setOverlay] = useState<'rules' | 'pieces' | null>(null);
  // Replacing unfinished work (with the mode to start next) or discarding asks first.
  const [confirm, setConfirm] = useState<
    { readonly kind: 'replace'; readonly mode: GameMode } | { readonly kind: 'discard' } | null
  >(null);
  const { view, session } = state;

  useEffect(() => saveSession(storage, state), [state]);

  const goHome = () => dispatch({ type: 'go-home' });
  const requestNewGame = (mode: GameMode) =>
    isUnfinished(session)
      ? setConfirm({ kind: 'replace', mode })
      : dispatch({ type: 'new-game', mode });

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={goHome}>
          Treasure Chess
        </button>
        <nav className={styles.nav} aria-label="Menu">
          <button type="button" className={styles.navLink} onClick={() => setOverlay('rules')}>
            Rules
          </button>
          <button type="button" className={styles.navLink} onClick={() => setOverlay('pieces')}>
            Pieces
          </button>
          <ThemeToggle className={styles.navLink} />
        </nav>
      </header>

      <main className={styles.main}>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}{' '}
            <button type="button" className={styles.dismiss} onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </p>
        )}
        {view === 'home' && (
          <Home
            session={session}
            onNewGame={requestNewGame}
            onContinue={() => dispatch({ type: 'continue' })}
            onDiscard={() => setConfirm({ kind: 'discard' })}
          />
        )}
        {view === 'session' && session?.kind === 'setup' && (
          <Setup
            setup={session.setup}
            dispatch={(action) => dispatch({ type: 'setup', action })}
            onStart={() => dispatch({ type: 'start-game' })}
            onCancel={goHome}
          />
        )}
        {view === 'session' && session?.kind === 'game' && (
          <Play
            game={session.game}
            mode={session.mode}
            onChange={(game) => dispatch({ type: 'update-game', game })}
            onNewGame={goHome}
          />
        )}
      </main>

      <footer className={styles.footer}>
        © 2026{' '}
        <a href="https://andersun.com" target="_blank" rel="noopener noreferrer">
          Justin Andersun
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        {' · '}
        <a
          href="https://github.com/justinandersun/treasure-chess"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
          <span className="visually-hidden"> code on GitHub (opens in a new tab)</span>
        </a>
      </footer>

      <Dialog open={overlay === 'rules'} title="Rules" onClose={() => setOverlay(null)}>
        <RulesContent onShowPieces={() => setOverlay('pieces')} />
      </Dialog>

      <Dialog open={overlay === 'pieces'} title="Pieces" onClose={() => setOverlay(null)}>
        <PiecesContent />
      </Dialog>

      <Dialog
        open={confirm !== null}
        title={confirm?.kind === 'discard' ? 'Discard Saved Game?' : 'Start a New Game?'}
        size="small"
        onClose={() => setConfirm(null)}
        actions={
          <>
            <Button variant="quiet" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (confirm?.kind === 'replace') dispatch({ type: 'new-game', mode: confirm.mode });
                else dispatch({ type: 'discard-session' });
                setConfirm(null);
              }}
            >
              {confirm?.kind === 'discard' ? 'Discard' : 'New Game'}
            </Button>
          </>
        }
      >
        <p>
          {confirm?.kind === 'discard'
            ? 'Your saved game will be deleted. This cannot be undone.'
            : 'Your saved game is not finished. Setting up a new game will replace it.'}
        </p>
      </Dialog>
    </div>
  );
}
