import { expect, test } from '@playwright/test';

test('the app can be installed and keeps working offline', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Playwright supports service workers in Chromium only');

  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  // A string, since the test files are typed for Node rather than the browser.
  await page.evaluate('navigator.serviceWorker.ready.then(() => undefined)');
  // Once the service worker controls the page, a reload caches everything the app uses.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Treasure Chess' })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Treasure Chess' })).toBeVisible();
  await page.getByRole('button', { name: 'Play a Friend' }).click();
  await expect(page.getByRole('heading', { name: 'Draft Your Army' })).toBeVisible();
});
