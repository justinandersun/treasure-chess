import { useReducer, useState } from 'react';
import styles from './App.module.css';
import { type AppAction, appReducer, hasUnsavedProgress, initialScreen } from './app/appState';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { ChooseMode } from './screens/ChooseMode';
import { Home } from './screens/Home';
import { LocalSetup } from './screens/LocalSetup';
import { Play } from './screens/Play';
import { RulesContent } from './screens/RulesContent';
import { SetupPlaceholder } from './screens/SetupPlaceholder';

export function App() {
  const [screen, dispatch] = useReducer(appReducer, initialScreen);
  const [rulesOpen, setRulesOpen] = useState(false);
  // A navigation waiting for the player to confirm discarding their progress.
  const [pendingLeave, setPendingLeave] = useState<AppAction | null>(null);
  const goHome = () => dispatch({ type: 'go-home' });

  function leave(action: AppAction) {
    if (hasUnsavedProgress(screen)) setPendingLeave(action);
    else dispatch(action);
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={() => leave({ type: 'go-home' })}>
          Treasure Chess
        </button>
        <Button variant="quiet" onClick={() => setRulesOpen(true)}>
          Rules
        </Button>
      </header>

      <main className={styles.main}>
        {screen.name === 'home' && (
          <Home
            onNewGame={() => dispatch({ type: 'new-game' })}
            onRules={() => setRulesOpen(true)}
          />
        )}
        {screen.name === 'choose-mode' && (
          <ChooseMode
            onChoose={(mode) => dispatch({ type: 'choose-mode', mode })}
            onBack={goHome}
          />
        )}
        {screen.name === 'computer-pending' && <SetupPlaceholder onBack={goHome} />}
        {screen.name === 'local-setup' && (
          <LocalSetup
            setup={screen.setup}
            dispatch={(action) => dispatch({ type: 'setup', action })}
            onStart={() => dispatch({ type: 'start-game' })}
            onCancel={() => leave({ type: 'new-game' })}
          />
        )}
        {screen.name === 'game' && (
          <Play
            game={screen.game}
            onChange={(game) => dispatch({ type: 'update-game', game })}
            onNewGame={() => dispatch({ type: 'new-game' })}
          />
        )}
      </main>

      <Dialog open={rulesOpen} title="Rules" onClose={() => setRulesOpen(false)}>
        <RulesContent />
      </Dialog>

      <Dialog
        open={pendingLeave !== null}
        title="Leave this game?"
        size="small"
        onClose={() => setPendingLeave(null)}
        actions={
          <>
            <Button variant="quiet" onClick={() => setPendingLeave(null)}>
              Stay
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (pendingLeave) dispatch(pendingLeave);
                setPendingLeave(null);
              }}
            >
              Leave
            </Button>
          </>
        }
      >
        <p>Your progress will be lost.</p>
      </Dialog>
    </div>
  );
}
