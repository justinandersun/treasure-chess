/**
 * Saves the current session to browser storage and restores it after a reload.
 *
 * The saved document is versioned. Setups are stored as plain data; games use the engine's
 * start-position-plus-actions format and are replayed on load. Anything unreadable — corrupt JSON,
 * an unknown version, data that fails validation, or a game that no longer replays — is discarded
 * rather than half-restored.
 */

import {
  type ArmyDraft,
  type Color,
  type Deployment,
  deploymentDraft,
  deserializeGame,
  DIFFICULTIES,
  type Difficulty,
  PIECE_TYPES,
  type PieceType,
  type SavedGame,
  serializeGame,
} from '@treasure-chess/game';
import type { AppState, Session, View } from '../app/appState';
import {
  DEFAULT_STARTER,
  type GameMode,
  gateAfterReload,
  type SetupState,
  type SetupStep,
} from '../app/setup';

export const STORAGE_KEY = 'treasure-chess/session';
export const SESSION_SCHEMA_VERSION = 2;

type SavedSession =
  | { readonly kind: 'setup'; readonly setup: SetupState }
  | {
      readonly kind: 'game';
      readonly game: SavedGame;
      readonly mode: GameMode;
      readonly difficulty: Difficulty;
    };

interface SavedDocument {
  readonly schemaVersion: typeof SESSION_SCHEMA_VERSION;
  readonly savedAt: string;
  /** Whether the session was on screen (as opposed to the player being on the Home screen). */
  readonly showing: boolean;
  readonly session: SavedSession;
}

/** The subset of the Web Storage API this module uses. */
export type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type LoadResult =
  | { readonly status: 'empty' }
  | { readonly status: 'restored'; readonly state: AppState }
  | { readonly status: 'discarded'; readonly reason: string };

// ---- Encoding -------------------------------------------------------------------------------

export function encodeSession(state: AppState, now = new Date()): string | null {
  const { session } = state;
  if (!session) return null;
  const saved: SavedSession =
    session.kind === 'setup'
      ? { kind: 'setup', setup: session.setup }
      : {
          kind: 'game',
          game: serializeGame(session.game),
          mode: session.mode,
          difficulty: session.difficulty,
        };
  const doc: SavedDocument = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    showing: state.view === 'session',
    session: saved,
  };
  return JSON.stringify(doc);
}

// ---- Validation -----------------------------------------------------------------------------

const STEPS: readonly SetupStep[] = ['draft', 'place', 'handoff', 'reveal'];
/** Steps from older builds, shown as the board with both armies. */
const RETIRED_STEPS = ['ready', 'opponent'];
const isMode = (v: unknown): v is GameMode => v === 'local' || v === 'computer';
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isColor = (v: unknown): v is Color => v === 'w' || v === 'b';
const isPieceType = (v: unknown): v is PieceType => PIECE_TYPES.includes(v as PieceType);

function isDraft(v: unknown): v is ArmyDraft {
  return (
    isObject(v) &&
    Object.entries(v).every(
      ([type, n]) => isPieceType(type) && Number.isInteger(n) && (n as number) >= 0,
    )
  );
}

function isRow(v: unknown): v is (PieceType | null)[] {
  return Array.isArray(v) && v.length === 8 && v.every((t) => t === null || isPieceType(t));
}

function isDeployment(v: unknown): v is Deployment {
  return isObject(v) && isRow(v.backRank) && isRow(v.pawnRow);
}

/**
 * Saves from before difficulty levels have none; the computer then played at what is now Advanced.
 * New games default to DEFAULT_DIFFICULTY instead.
 */
const LEGACY_DIFFICULTY: Difficulty = 'advanced';
const difficultyOr = (v: unknown): Difficulty =>
  DIFFICULTIES.includes(v as Difficulty) ? (v as Difficulty) : LEGACY_DIFFICULTY;

/**
 * Brings a saved setup up to date: fills in a missing difficulty, and moves a setup saved at a
 * retired step onto the board step (the computer gets a default army).
 */
function upgradeSetup(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const v: Record<string, unknown> = { ...raw, difficulty: difficultyOr(raw.difficulty) };
  if (!RETIRED_STEPS.includes(v.step as string)) return v;
  if (v.step === 'opponent' && isObject(v.drafts) && isObject(v.deployments)) {
    return {
      ...v,
      step: 'reveal',
      drafts: { ...v.drafts, b: deploymentDraft(DEFAULT_STARTER.deployment) },
      deployments: { ...v.deployments, b: DEFAULT_STARTER.deployment },
    };
  }
  return { ...v, step: 'reveal' };
}

function isSetup(v: unknown): v is SetupState {
  if (!isObject(v) || !isMode(v.mode) || !STEPS.includes(v.step as SetupStep)) return false;
  if (!isColor(v.color) || !DIFFICULTIES.includes(v.difficulty as Difficulty)) return false;
  if (v.resume !== undefined && v.resume !== 'draft' && v.resume !== 'place') return false;
  const { drafts, deployments } = v;
  return (
    isObject(drafts) &&
    isDraft(drafts.w) &&
    isDraft(drafts.b) &&
    isObject(deployments) &&
    isDeployment(deployments.w) &&
    isDeployment(deployments.b)
  );
}

/**
 * Upgrades older saved documents to the current schema, one version at a time. Returns null for
 * versions this build does not understand (including newer ones).
 */
export function migrate(doc: Record<string, unknown>): Record<string, unknown> | null {
  let current = doc;
  if (current.schemaVersion === 1) {
    // v1 had only two-player games, with the mode stored once at the top level.
    const rest = { ...current };
    delete rest.mode;
    const session = isObject(rest.session) ? rest.session : {};
    const migrated =
      session.kind === 'setup' && isObject(session.setup)
        ? { ...session, setup: { ...session.setup, mode: 'local' } }
        : { ...session, mode: 'local' };
    current = { ...rest, schemaVersion: 2, session: migrated };
  }
  return current.schemaVersion === SESSION_SCHEMA_VERSION ? current : null;
}

// ---- Decoding -------------------------------------------------------------------------------

export function decodeSession(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { status: 'discarded', reason: 'The saved game could not be read.' };
  }
  const doc = isObject(raw) ? migrate(raw) : null;
  if (!doc)
    return { status: 'discarded', reason: 'The saved game is from an unsupported version.' };

  const saved = doc.session;
  let session: Session;
  const savedSetup = isObject(saved) && saved.kind === 'setup' ? upgradeSetup(saved.setup) : null;
  if (isSetup(savedSetup)) {
    session = { kind: 'setup', setup: gateAfterReload(savedSetup) };
  } else if (isObject(saved) && saved.kind === 'game' && isMode(saved.mode)) {
    try {
      session = {
        kind: 'game',
        game: deserializeGame(saved.game),
        mode: saved.mode,
        difficulty: difficultyOr(saved.difficulty),
      };
    } catch {
      return { status: 'discarded', reason: 'The saved game could not be replayed.' };
    }
  } else {
    return { status: 'discarded', reason: 'The saved game is damaged.' };
  }
  const view: View = doc.showing === true ? 'session' : 'home';
  return { status: 'restored', state: { view, session } };
}

// ---- Storage --------------------------------------------------------------------------------

/** Browser storage, or null where it is unavailable (some private modes, blocked cookies). */
export function browserStorage(): SessionStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSession(storage: SessionStorage | null): LoadResult {
  let text: string | null;
  try {
    text = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return { status: 'empty' };
  }
  if (text === null) return { status: 'empty' };
  const result = decodeSession(text);
  if (result.status === 'discarded') clearSession(storage);
  return result;
}

/** Writes the session, or removes it when there is none. Storage errors are ignored. */
export function saveSession(storage: SessionStorage | null, state: AppState): void {
  try {
    const text = encodeSession(state);
    if (text === null) storage?.removeItem(STORAGE_KEY);
    else storage?.setItem(STORAGE_KEY, text);
  } catch {
    // Quota exceeded or storage blocked: keep playing without saving.
  }
}

export function clearSession(storage: SessionStorage | null): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
