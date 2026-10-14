import { expect, test } from '@playwright/test';
import { movesList, square, startLocalGame } from './helpers';

test.skip(({ isMobile }) => isMobile, 'Keyboard play is a desktop concern');

test('a move can be played with the keyboard alone', async ({ page }) => {
  await startLocalGame(page, 'classic', 'classic');
  // The board has one tab stop; it starts on White's King.
  await square(page, 'e1').focus();
  await page.keyboard.press('ArrowUp'); // e2
  await page.keyboard.press('Enter');
  await expect(square(page, 'e2')).toHaveAccessibleName(/selected/);
  await page.keyboard.press('ArrowUp'); // e3
  await page.keyboard.press('ArrowUp'); // e4
  await page.keyboard.press('Enter');
  await expect(movesList(page)).toContainText('e4');
  await expect(square(page, 'e4')).toBeFocused();
});

test('dialogs trap focus and close with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rules' }).first().click();
  const rules = page.getByRole('dialog', { name: 'Rules' });
  await expect(rules).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(rules).toBeHidden();
});
