import { expect, test } from '@playwright/test';
import { move, movesList, square, startLocalGame, startNewGame, usePreset } from './helpers';

test('two players set up in private and play to checkmate', async ({ page }) => {
  await startNewGame(page, 'friend');
  await expect(page.getByRole('heading', { name: 'Draft Your Army' })).toBeVisible();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  // The handoff screen shows no board, so Black cannot see White's army.
  await expect(page.getByRole('heading', { name: 'Pass the Device to Black' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();

  await move(page, 'f2', 'f3');
  await move(page, 'e7', 'e5');
  await move(page, 'g2', 'g4');
  await move(page, 'd8', 'h4');

  const result = page.getByRole('dialog', { name: 'Checkmate — Black Wins' });
  await expect(result).toBeVisible();
  await expect(movesList(page)).toContainText('Queen h4#');

  // Closing the result dialog leaves the final position to review; Undo takes the move back.
  await result.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(result).toBeHidden();
  await expect(page.getByRole('status')).toContainText('Black to move');
});

test('custom drafting enforces the point budget and placement rules', async ({ page }) => {
  await startNewGame(page, 'friend');
  const add = (name: string) => page.getByRole('button', { name: `Add ${name}` });
  await page.getByRole('button', { name: 'Clear' }).click(); // drafts start as Classic
  await expect(add('King')).toHaveCount(0); // the King is always included

  // Tapping a piece's name shows how it moves.
  await page.getByRole('button', { name: /^Queen( ·|$)/ }).click();
  const details = page.getByRole('dialog', { name: 'Queen' });
  await expect(details).toContainText('any distance along a rank, file, or diagonal');
  await details.getByRole('button', { name: 'Close' }).click();
  for (let i = 0; i < 8; i++) await add('Sergeant').click();
  await add('Queen').click();
  await add('Queen').click();
  // 1 + 16 + 18 = 35 points; a third Queen would cost 44.
  await expect(add('Queen')).toBeDisabled();
  await expect(add('Pawn')).toBeDisabled(); // pawn row full
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Pieces kept from the Classic formation are already placed; start from an empty board.
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByRole('button', { name: /^King, 1 to place/ }).click();
  await expect(page.getByRole('button', { name: /^d1, empty, can move here/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^c1, empty, can move here/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Random' }).click();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeEnabled();
});

test('reloading keeps the session and hides private armies', async ({ page }) => {
  await startNewGame(page, 'friend');
  await usePreset(page, 'menagerie');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pass the Device to White' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Place Your Army' })).toBeVisible();

  await startLocalGame(page, 'classic', 'stampede', true);
  await move(page, 'e2', 'e4');
  await page.reload();
  await expect(movesList(page)).toContainText('e4');
  await page.getByRole('button', { name: 'Treasure Chess' }).click();
  await expect(page.getByRole('button', { name: 'Resume Game' })).toBeVisible();
});

test('the Rules overlay links to the Pieces overlay', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rules' }).click();
  await page.getByRole('dialog', { name: 'Rules' }).getByRole('button', { name: 'Pieces' }).click();
  await expect(page.getByRole('dialog', { name: 'Pieces' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Rules' })).toBeHidden();
});

test('pieces can be dragged onto the board, between squares, and back to the tray', async ({
  page,
}) => {
  await startNewGame(page, 'friend');
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Clear' }).click();

  const tray = page.getByRole('group', { name: 'Pieces to place' });
  await tray.getByRole('button', { name: /^King, 1 to place/ }).dragTo(square(page, 'e1'));
  await expect(square(page, 'e1')).toHaveAccessibleName(/^e1, White King/);

  await square(page, 'e1').dragTo(square(page, 'd1'));
  await expect(square(page, 'd1')).toHaveAccessibleName(/^d1, White King/);
  await expect(square(page, 'e1')).toHaveAccessibleName(/^e1, empty/);

  await square(page, 'd1').dragTo(tray);
  await expect(tray.getByRole('button', { name: /^King, 1 to place/ })).toBeVisible();

  // Tapping a placed piece shows a circle in the tray that sends it back.
  await tray.getByRole('button', { name: /^King, 1 to place/ }).dragTo(square(page, 'e1'));
  await square(page, 'e1').click();
  await tray.getByRole('button', { name: 'Return the King to the tray' }).click();
  await expect(square(page, 'e1')).toHaveAccessibleName(/^e1, empty/);
  await expect(tray.getByRole('button', { name: /^King, 1 to place/ })).toBeVisible();
});

test('a shared army link becomes the starting army', async ({ page }) => {
  await page.goto('/?army=MYCKF.YM-PGSPPSGP');
  await expect(page.getByRole('status')).toContainText('Someone shared an army with you');
  await expect(page).not.toHaveURL(/army=/); // reloading will not offer it again

  await page.getByRole('button', { name: 'Play a Friend' }).click();
  await expect(page.getByLabel('Starter Army')).toHaveValue('menagerie');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Share This Army' })).toBeVisible();
});
