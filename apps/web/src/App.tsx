import { useEffect, useReducer, useState } from 'react';
import styles from './App.module.css';
import { appReducer, type AppState, initialAppState, isUnfinished } from './app/appState';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { browserStorage, loadSession, saveSession } from './persistence/session';
import { ChooseMode } from './screens/ChooseMode';
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
  const [confirm, setConfirm] = useState<'replace' | 'discard' | null>(null);
  const { view, session } = state;

  useEffect(() => saveSession(storage, state), [state]);

  const goHome = () => dispatch({ type: 'go-home' });
  const requestNewGame = () =>
    isUnfinished(session) ? setConfirm('replace') : dispatch({ type: 'new-game' });

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={goHome}>
          Treasure Chess
        </button>
        <nav className={styles.nav} aria-label="Reference">
          <button type="button" className={styles.navLink} onClick={() => setOverlay('rules')}>
            Rules
          </button>
          <button type="button" className={styles.navLink} onClick={() => setOverlay('pieces')}>
            Pieces
          </button>
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
            onDiscard={() => setConfirm('discard')}
            onRules={() => setOverlay('rules')}
          />
        )}
        {view === 'choose-mode' && (
          <ChooseMode
            onChoose={(mode) => dispatch({ type: 'choose-mode', mode })}
            onBack={goHome}
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
            onNewGame={() => dispatch({ type: 'new-game' })}
          />
        )}
      </main>

      <footer className={styles.footer}>
        © 2026{' '}
        <a href="https://andersun.com" target="_blank" rel="noopener noreferrer">
          Justin Andersun
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </footer>

      <Dialog open={overlay === 'rules'} title="Rules" onClose={() => setOverlay(null)}>
        <RulesContent />
      </Dialog>

      <Dialog open={overlay === 'pieces'} title="Pieces" onClose={() => setOverlay(null)}>
        <PiecesContent />
      </Dialog>

      <Dialog
        open={confirm !== null}
        title={confirm === 'discard' ? 'Discard saved game?' : 'Start a new game?'}
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
                dispatch({ type: confirm === 'discard' ? 'discard-session' : 'new-game' });
                setConfirm(null);
              }}
            >
              {confirm === 'discard' ? 'Discard' : 'New game'}
            </Button>
          </>
        }
      >
        <p>
          {confirm === 'discard'
            ? 'Your saved game will be deleted. This cannot be undone.'
            : 'Your saved game is not finished. Setting up a new game will replace it.'}
        </p>
      </Dialog>
    </div>
  );
}
