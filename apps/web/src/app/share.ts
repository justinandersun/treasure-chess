/**
 * Sharing armies by link: `?army=MYCKF.YM-PGSPPSGP` (see armyCode in the game package). Opening
 * such a link offers that army as White's starting draft.
 */

import { armyCode, type Deployment, parseArmyCode } from '@treasure-chess/game';

const ARMY_PARAM = 'army';

/** A link to this app that carries `army`. */
export function armyLink(army: Deployment, location: Location = window.location): string {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set(ARMY_PARAM, armyCode(army));
  return url.href;
}

/**
 * The valid army in the page's link, if any. The parameter is then removed from the address bar,
 * so reloading does not offer the army again.
 */
export function takeSharedArmy(): Deployment | null {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(ARMY_PARAM);
    if (code === null) return null;
    url.searchParams.delete(ARMY_PARAM);
    window.history.replaceState(window.history.state, '', url.href);
    return parseArmyCode(code);
  } catch {
    return null;
  }
}
