import { expect, test } from '@playwright/test';
import { move, movesList, startComputerGame, startNewGame } from './helpers';

test('the computer replies, and undo takes back both moves', async ({ page }) => {
  await startComputerGame(page, 'classic', 'Bulwark');
  await move(page, 'e2', 'e4');
  await expect(page.getByRole('status')).toContainText('The computer is thinking');
  await expect(page.getByRole('status')).toContainText('Your move', { timeout: 10_000 });
  await expect(movesList(page).getByRole('listitem')).toHaveCount(1);
  await expect(movesList(page)).toContainText(/1\.\s*Pawn e4\s*\S+/);

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

test("the computer's level can be chosen before the game and is remembered", async ({ page }) => {
  await startNewGame(page, 'computer');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Intermediate Computer plays')).toBeVisible();

  await page.getByRole('button', { name: 'Change Level' }).click();
  await page
    .getByRole('dialog', { name: 'Computer’s Level' })
    .getByRole('button', { name: /^Beginner/ })
    .click();
  await expect(page.getByText('Beginner Computer plays')).toBeVisible();
  await page.getByRole('button', { name: 'Start Game' }).click();

  await move(page, 'e2', 'e4');
  await expect(movesList(page)).toContainText(/1\.\s*Pawn e4\s*\S+/, { timeout: 10_000 });

  await page.getByRole('button', { name: 'Treasure Chess' }).click();
  await expect(page.getByText('vs. Beginner Computer · Move 2')).toBeVisible();
});
