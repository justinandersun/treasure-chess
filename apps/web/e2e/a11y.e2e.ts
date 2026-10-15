import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { move, startLocalGame, startNewGame, usePreset } from './helpers';

/** Fails on any serious or critical WCAG A/AA violation axe can detect. */
async function expectAccessible(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const problems = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id}: ${v.help} (${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(', ')})`,
    );
  expect(problems, `${label} accessibility`).toEqual([]);
}

test('every screen passes automated accessibility checks', async ({ page }) => {
  await page.goto('/');
  await expectAccessible(page, 'Home');

  await page.getByRole('button', { name: 'Rules' }).click();
  await expectAccessible(page, 'Rules dialog');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Pieces' }).click();
  await expectAccessible(page, 'Pieces dialog');
  await page.keyboard.press('Escape');

  await startNewGame(page, 'friend');
  await expectAccessible(page, 'Draft');
  await usePreset(page, 'regency');
  await expectAccessible(page, 'Place');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expectAccessible(page, 'Handoff');

  await startLocalGame(page, 'classic', 'classic', true);
  await move(page, 'f2', 'f3');
  await page.getByRole('button', { name: /^g8,/ }).click(); // inspect an opponent piece
  await expectAccessible(page, 'Play');
  await move(page, 'e7', 'e5');
  await move(page, 'g2', 'g4');
  await move(page, 'd8', 'h4');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectAccessible(page, 'Result dialog');
});

test('dark mode passes the contrast checks too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expectAccessible(page, 'Home (dark)');
  await page.getByRole('button', { name: 'Pieces' }).click();
  await expectAccessible(page, 'Pieces dialog (dark)');
  await page.keyboard.press('Escape');
  await startLocalGame(page, 'menagerie', 'conclave');
  await expectAccessible(page, 'Play (dark)');
});
