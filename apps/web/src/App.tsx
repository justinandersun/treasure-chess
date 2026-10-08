import { useReducer, useState } from 'react';
import styles from './App.module.css';
import { appReducer, initialScreen } from './app/appState';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { ChooseMode } from './screens/ChooseMode';
import { Home } from './screens/Home';
import { Preview } from './screens/Preview';
import { RulesContent } from './screens/RulesContent';
import { LocalSetup } from './screens/LocalSetup';
import { SetupPlaceholder } from './screens/SetupPlaceholder';

export function App() {
  const [screen, dispatch] = useReducer(appReducer, initialScreen);
  const [rulesOpen, setRulesOpen] = useState(false);
  const goHome = () => dispatch({ type: 'go-home' });
  const openPreview = () => dispatch({ type: 'open-preview' });

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={goHome}>
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
            onPreview={openPreview}
          />
        )}
        {screen.name === 'choose-mode' && (
          <ChooseMode
            onChoose={(mode) => dispatch({ type: 'choose-mode', mode })}
            onBack={goHome}
          />
        )}
        {screen.name === 'computer-pending' && (
          <SetupPlaceholder onBack={goHome} onPreview={openPreview} />
        )}
        {screen.name === 'local-setup' && (
          <LocalSetup
            setup={screen.setup}
            dispatch={(action) => dispatch({ type: 'setup', action })}
            onStart={() => dispatch({ type: 'start-game' })}
            onCancel={() => dispatch({ type: 'new-game' })}
          />
        )}
        {screen.name === 'game' && <Preview initialGame={screen.game} onBack={goHome} />}
        {screen.name === 'preview' && <Preview onBack={goHome} />}
      </main>

      <Dialog open={rulesOpen} title="Rules" onClose={() => setRulesOpen(false)}>
        <RulesContent />
      </Dialog>
    </div>
  );
}
