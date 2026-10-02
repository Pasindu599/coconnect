import { expect, type Page } from '@playwright/test';

export type Category = 'coconut' | 'construction';

/** Sign in through the real screen with the demo code. A new phone number registers a new user. */
export async function signIn(page: Page, category: Category, roleId: string, phone?: string) {
  await page.goto(`/#/${category}/login`);
  await page.getByTestId(`login-role-${roleId}`).click();
  if (phone) await page.locator('input[type="tel"]').fill(phone);
  await page.locator('button[type="submit"]').click(); // send the code
  await page.locator('input[maxlength="6"]').waitFor();
  await page.locator('button[type="submit"]').click(); // verify (the demo code is prefilled)
  await expect(page).toHaveURL(new RegExp(`#/${category}/dashboard$`));
}

export async function signOut(page: Page) {
  await page.getByTestId('account-menu').click();
  await page.getByTestId('logout').click();
  await expect(page).toHaveURL(/#\/$/);
}

/** Staff sign-in with the demo credentials. */
export async function signInAdmin(page: Page) {
  await page.goto('/#/admin');
  await page.locator('input[type="email"]').fill('niluka.fernando@coconnect.gov.lk');
  await page.locator('input[type="password"]').fill('9999');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Internal Control Panel')).toBeVisible();
}

/** The seeded construction job whose money is already held in escrow (client: Nimal, contractor: Ranjith). */
export const HELD_JOB = { task: 'Plastering & Painting', award: 'award-c-3', amount: 'LKR 145,000' };

/** The contractor submits wages and the client signs off with the PIN, so the award waits for a payout. */
export async function completeHeldJob(page: Page) {
  await signIn(page, 'construction', 'contractor');
  await page.getByTestId('tab-completions').click();
  await page.getByTestId('submit-completion').first().click();
  await page.getByTestId('send-completion').click();
  await signOut(page);

  await signIn(page, 'construction', 'client');
  const card = page.locator(`[data-testid="job-card"][data-job-task="${HELD_JOB.task}"]`);
  await card.getByTestId('verify-release').click();
  await page.locator('input[type="password"]').fill('1234');
  await page.getByTestId('confirm-release').click();
  await expect(card).toHaveAttribute('data-job-status', 'COMPLETED');
}
