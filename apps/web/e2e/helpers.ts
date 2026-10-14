import { expect, type Page } from '@playwright/test';

/** A board square button, by its accessible name ("e2, White Pawn, …"). */
export function square(page: Page, name: string) {
  return page.getByRole('button', { name: new RegExp(`^${name},`) });
}

export async function move(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

export async function usePreset(page: Page, presetId: string) {
  await page.getByLabel('Starter Army').selectOption(presetId);
  await page.getByRole('button', { name: 'Use', exact: true }).click();
}

/**
 * Opens Home and starts setting up a new game. Pass `replace` when a saved, unfinished session
 * exists: Home then asks before replacing it.
 */
export async function startNewGame(
  page: Page,
  mode: 'Human vs. Human' | 'Human vs. Computer',
  { replace = false } = {},
) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Treasure Chess' }).click();
  await page.getByRole('button', { name: 'New Game' }).click();
  if (replace) {
    await page
      .getByRole('dialog', { name: 'Start a New Game?' })
      .getByRole('button', { name: 'New Game' })
      .click();
  }
  await page.getByRole('button', { name: mode }).click();
}

/** Sets up a two-player game with presets for both sides and starts it. */
export async function startLocalGame(page: Page, white: string, black: string, replace = false) {
  await startNewGame(page, 'Human vs. Human', { replace });
  await usePreset(page, white);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await usePreset(page, black);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByRole('status')).toContainText('White to move');
}

/** Sets up a game against the computer and starts it. */
export async function startComputerGame(page: Page, mine: string, theirs: string) {
  await startNewGame(page, 'Human vs. Computer');
  await usePreset(page, mine);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`^${theirs}`) }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.getByRole('status')).toContainText('Your move');
}

export function movesList(page: Page) {
  return page.getByRole('list', { name: 'Moves played' });
}
