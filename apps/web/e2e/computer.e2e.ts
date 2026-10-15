import { expect, test } from '@playwright/test';
import { move, movesList, startComputerGame } from './helpers';

test('the computer replies, and undo takes back both moves', async ({ page }) => {
  await startComputerGame(page, 'classic', 'Bulwark');
  await move(page, 'e2', 'e4');
  await expect(page.getByRole('status')).toContainText('The computer is thinking');
  await expect(page.getByRole('status')).toContainText('Your move', { timeout: 10_000 });
  await expect(movesList(page).getByRole('listitem')).toHaveCount(1);
  await expect(movesList(page)).toContainText(/1\.\s*e4\s*\S+/);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('No moves yet.')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Your move');
});

test("the computer's pieces can be inspected but not moved", async ({ page }) => {
  await startComputerGame(page, 'classic', 'Stampede');
  await page.getByRole('button', { name: /^g8,/ }).click();
  await expect(page.getByRole('status')).toContainText('Black Knight on g8');
  await page.getByRole('button', { name: /^f6, empty, can move here/ }).click();
  await expect(page.getByText('No moves yet.')).toBeVisible();
});
