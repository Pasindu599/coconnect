import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = 'niluka.fernando@coconnect.gov.lk';

test('staff sign-in rejects a wrong PIN and accepts the right one', async ({ page }) => {
  await page.goto('/#/admin');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill('000000');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Administrative credentials rejected')).toBeVisible();
  await expect(page.getByText('Internal Control Panel')).toHaveCount(0);

  await page.locator('input[type="password"]').fill('9999');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Internal Control Panel')).toBeVisible();
});

test('the public sign-in cannot open the admin account', async ({ page }) => {
  await page.goto('/#/coconut/login');
  await page.locator('input[type="tel"]').fill('+94 77 000 1122'); // the seeded admin's phone
  await page.locator('button[type="submit"]').click();
  await page.locator('input[maxlength="6"]').waitFor();
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole('alert')).toContainText('Staff accounts cannot sign in here');
  await expect(page.getByText('Internal Control Panel')).toHaveCount(0);
});
