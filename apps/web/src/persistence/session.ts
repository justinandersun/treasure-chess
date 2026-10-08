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
  deserializeGame,
  PIECE_TYPES,
  type PieceType,
  type SavedGame,
  serializeGame,
} from '@treasure-chess/game';
import type { AppState, Session, View } from '../app/appState';
import { gateAfterReload, type SetupState, type SetupStep } from '../app/setup';

export const STORAGE_KEY = 'treasure-chess/session';
export const SESSION_SCHEMA_VERSION = 1;

type SavedSession =
  | { readonly kind: 'setup'; readonly setup: SetupState }
  | { readonly kind: 'game'; readonly game: SavedGame };

interface SavedDocument {
  readonly schemaVersion: typeof SESSION_SCHEMA_VERSION;
  readonly savedAt: string;
  /** Whether the session was on screen (as opposed to the player being on the Home screen). */
  readonly showing: boolean;
  readonly mode: 'local';
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
      : { kind: 'game', game: serializeGame(session.game) };
  const doc: SavedDocument = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    showing: state.view === 'session',
    mode: 'local',
    session: saved,
  };
  return JSON.stringify(doc);
}

// ---- Validation -----------------------------------------------------------------------------

const STEPS: readonly SetupStep[] = ['draft', 'place', 'handoff', 'ready', 'reveal'];
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

function isSetup(v: unknown): v is SetupState {
  if (!isObject(v) || !STEPS.includes(v.step as SetupStep) || !isColor(v.color)) return false;
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

/** Upgrades older saved documents to the current schema. None exist yet. */
function migrate(doc: Record<string, unknown>): Record<string, unknown> | null {
  return doc.schemaVersion === SESSION_SCHEMA_VERSION ? doc : null;
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
  if (isObject(saved) && saved.kind === 'setup' && isSetup(saved.setup)) {
    session = { kind: 'setup', setup: gateAfterReload(saved.setup) };
  } else if (isObject(saved) && saved.kind === 'game') {
    try {
      session = { kind: 'game', game: deserializeGame(saved.game) };
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
