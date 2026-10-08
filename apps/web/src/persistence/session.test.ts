import { formatPosition, moveHistory, parseSquare, playMove, resign } from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import { type AppAction, appReducer, type AppState, initialAppState } from '../app/appState';
import {
  decodeSession,
  encodeSession,
  loadSession,
  saveSession,
  type SessionStorage,
  STORAGE_KEY,
} from './session';

function memoryStorage(initial: Record<string, string> = {}): SessionStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const run = (state: AppState, ...actions: AppAction[]) => actions.reduce(appReducer, state);
const setupAction = (action: Extract<AppAction, { type: 'setup' }>['action']): AppAction => ({
  type: 'setup',
  action,
});

/** Classic vs Cavalry, revealed and started. */
function startedGame(): AppState {
  return run(
    initialAppState,
    { type: 'choose-mode', mode: 'local' },
    setupAction({ type: 'use-preset', presetId: 'classic' }),
    setupAction({ type: 'lock' }),
    setupAction({ type: 'continue' }),
    setupAction({ type: 'use-preset', presetId: 'cavalry' }),
    setupAction({ type: 'lock' }),
    setupAction({ type: 'continue' }),
    { type: 'start-game' },
  );
}

function reload(state: AppState): AppState {
  const result = decodeSession(encodeSession(state)!);
  if (result.status !== 'restored') throw new Error(`Not restored: ${JSON.stringify(result)}`);
  return result.state;
}

describe('saving and restoring sessions', () => {
  it('saves nothing when there is no session', () => {
    expect(encodeSession(initialAppState)).toBeNull();
  });

  it('restores a game in progress exactly', () => {
    let state = startedGame();
    if (state.session?.kind !== 'game') throw new Error('expected a game');
    let game = playMove(state.session.game, { from: parseSquare('e2'), to: parseSquare('e4') });
    game = playMove(game, { from: parseSquare('b8'), to: parseSquare('c6') });
    state = appReducer(state, { type: 'update-game', game });

    const restored = reload(state);
    expect(restored.view).toBe('session');
    if (restored.session?.kind !== 'game') throw new Error('expected a game');
    expect(formatPosition(restored.session.game.position)).toBe(formatPosition(game.position));
    expect(moveHistory(restored.session.game)).toEqual(moveHistory(game));
    expect(restored.session.game.promotionTypes).toEqual(game.promotionTypes);
  });

  it('restores finished games, including resignations', () => {
    const state = startedGame();
    if (state.session?.kind !== 'game') throw new Error('expected a game');
    const over = appReducer(state, { type: 'update-game', game: resign(state.session.game, 'b') });
    const restored = reload(over);
    expect(restored.session?.kind === 'game' && restored.session.game.result).toEqual({
      kind: 'resignation',
      winner: 'w',
    });
  });

  it('remembers whether the player was on the Home screen', () => {
    const atHome = appReducer(startedGame(), { type: 'go-home' });
    expect(reload(atHome).view).toBe('home');
    expect(reload(atHome).session?.kind).toBe('game');
  });

  it('restores a setup behind a handoff so the army stays hidden', () => {
    const placingBlack = run(
      initialAppState,
      { type: 'choose-mode', mode: 'local' },
      setupAction({ type: 'use-preset', presetId: 'classic' }),
      setupAction({ type: 'lock' }),
      setupAction({ type: 'continue' }),
      setupAction({ type: 'use-preset', presetId: 'menagerie' }),
    );
    const restored = reload(placingBlack);
    if (restored.session?.kind !== 'setup') throw new Error('expected a setup');
    expect(restored.session.setup).toMatchObject({ step: 'handoff', color: 'b', resume: 'place' });
    const resumed = appReducer(restored, setupAction({ type: 'continue' }));
    expect(resumed.session?.kind === 'setup' && resumed.session.setup.step).toBe('place');
  });
});

describe('rejecting bad saved data', () => {
  const discarded = (text: string) => decodeSession(text).status;

  it('discards unreadable, unknown-version, and malformed documents', () => {
    const good = JSON.parse(encodeSession(startedGame())!);
    expect(discarded('{not json')).toBe('discarded');
    expect(discarded('null')).toBe('discarded');
    expect(discarded(JSON.stringify({ ...good, schemaVersion: 99 }))).toBe('discarded');
    expect(discarded(JSON.stringify({ ...good, session: { kind: 'other' } }))).toBe('discarded');
    const illegal = { ...good.session.game, actions: ['e2e5'] };
    expect(discarded(JSON.stringify({ ...good, session: { kind: 'game', game: illegal } }))).toBe(
      'discarded',
    );
  });

  it('discards setups with invalid contents', () => {
    const doc = JSON.parse(
      encodeSession(run(initialAppState, { type: 'choose-mode', mode: 'local' }))!,
    );
    const withSetup = (setup: unknown) =>
      JSON.stringify({ ...doc, session: { kind: 'setup', setup } });
    expect(discarded(withSetup(doc.session.setup))).toBe('restored');
    expect(discarded(withSetup({ ...doc.session.setup, step: 'dance' }))).toBe('discarded');
    expect(
      discarded(withSetup({ ...doc.session.setup, drafts: { w: { dragon: 1 }, b: {} } })),
    ).toBe('discarded');
    expect(
      discarded(
        withSetup({
          ...doc.session.setup,
          deployments: { w: { backRank: [], pawnRow: [] }, b: doc.session.setup.deployments.b },
        }),
      ),
    ).toBe('discarded');
  });
});

describe('storage access', () => {
  it('round-trips through storage and clears when the session ends', () => {
    const storage = memoryStorage();
    const state = startedGame();
    saveSession(storage, state);
    expect(storage.data[STORAGE_KEY]).toBeDefined();
    expect(loadSession(storage).status).toBe('restored');
    saveSession(storage, appReducer(state, { type: 'discard-session' }));
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
    expect(loadSession(storage).status).toBe('empty');
  });

  it('removes saved data that cannot be restored', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{broken' });
    expect(loadSession(storage).status).toBe('discarded');
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it('survives storage that throws or is missing', () => {
    const throwing: SessionStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSession(throwing).status).toBe('empty');
    expect(() => saveSession(throwing, startedGame())).not.toThrow();
    expect(loadSession(null).status).toBe('empty');
    expect(() => saveSession(null, startedGame())).not.toThrow();
  });
});
