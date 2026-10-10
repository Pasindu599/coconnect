import { expect, test } from '@playwright/test';
import { signIn, signOut, type Category } from './helpers';

interface Flow {
  category: Category;
  poster: string;
  bidder: string;
  /** A seeded job that is active with the money held in escrow. */
  task: string;
}

const FLOWS: Flow[] = [
  { category: 'construction', poster: 'client', bidder: 'contractor', task: 'Plastering & Painting' },
  { category: 'coconut', poster: 'owner', bidder: 'agent', task: 'Fertilizer Ring Application & Mulching' },
];

for (const flow of FLOWS) {
  test(`${flow.category}: the bidder submits the wages, the poster signs off with a PIN and the payout is requested`, async ({ page }) => {
    const job = (selector: string) => page.locator(`${selector}[data-job-task="${flow.task}"]`);

    // 1. The bidder submits wages and completion
    await signIn(page, flow.category, flow.bidder);
    await page.getByTestId('tab-completions').click();
    await page.getByTestId('submit-completion').first().click();
    await page.getByTestId('send-completion').click();
    await signOut(page);

    // 2. The poster sees it waiting, tries a wrong PIN, then the right one
    await signIn(page, flow.category, flow.poster);
    await expect(job('[data-testid="job-card"]')).toHaveAttribute('data-job-status', 'PENDING_COMPLETION');
    await job('[data-testid="job-card"]').getByTestId('verify-release').click();

    const pin = page.locator('input[type="password"]');
    await pin.fill('0000');
    await page.getByTestId('confirm-release').click();
    await expect(page.getByText(/invalid pin/i)).toBeVisible();
    await expect(job('[data-testid="job-card"]')).toHaveAttribute('data-job-status', 'PENDING_COMPLETION');

    await pin.fill('1234');
    await page.getByTestId('confirm-release').click();

    // 3. The job is complete, but the money has not left escrow: an admin still has to pay it out
    const card = job('[data-testid="job-card"]');
    await expect(card).toHaveAttribute('data-job-status', 'COMPLETED');
    await expect(card.getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'release_requested');
    await expect(card.getByTestId('escrow-step-completion')).toHaveAttribute('data-state', 'done');
    await expect(card.getByTestId('escrow-step-paid_out')).toHaveAttribute('data-state', 'current');
    await expect(card).toContainText(/payment is being sent/i);
  });
}

test('construction: a contractor registers a worker with consent and bank details, and the worker sees them', async ({ page }) => {
  const phone = '+94 77 888 0001';

  await signIn(page, 'construction', 'contractor');
  await page.getByTestId('add-worker').click();
  await page.getByTestId('worker-name').fill('Nuwan Perera');
  await page.getByTestId('worker-phone').fill(phone);

  // Consent comes first: nothing is registered without it
  await page.getByTestId('register-worker').click();
  await expect(page.getByText('Confirm that the worker has agreed before registering them.')).toBeVisible();
  await page.getByTestId('consent-confirm').check();

  // A bad account number is refused, a good one accepted
  await page.getByTestId('bank-code').selectOption('COM');
  await page.getByTestId('bank-account').fill('12-34');
  await page.getByTestId('register-worker').click();
  await expect(page.getByText('Enter a valid account number: 6 to 16 digits.')).toBeVisible();
  await page.getByTestId('bank-account').fill('11223344');
  await page.getByTestId('register-worker').click();

  const card = page.locator('[data-testid="roster-card"][data-worker-name="Nuwan Perera"]');
  await expect(card.getByTestId('worker-bank')).toHaveText('Commercial Bank ••••3344');

  // Fix the account from the roster
  await card.getByTestId('edit-worker-bank').click();
  await page.getByTestId('bank-account').fill('99887766');
  await page.getByTestId('bank-save').click();
  await expect(page.getByText('Bank details saved.')).toBeVisible();
  await expect(card.getByTestId('worker-bank')).toHaveText('Commercial Bank ••••7766');
  await signOut(page);

  // The worker signs in with that number and sees what was recorded about them
  await signIn(page, 'construction', 'worker', phone);
  await expect(page.getByTestId('worker-payout-bank')).toHaveText('Commercial Bank ••••7766');
  await expect(page.getByTestId('worker-consent')).toContainText('SMS OTP Confirmation');
});

test('a contractor can add their own payout account on the profile page', async ({ page }) => {
  await signIn(page, 'construction', 'contractor');
  await page.goto('/#/construction/profile');
  const card = page.getByTestId('payout-account');
  await expect(card.getByTestId('payout-current')).toHaveText('No bank details yet');

  await card.getByTestId('bank-code').selectOption('HNB');
  await card.getByTestId('bank-account').fill('abc');
  await card.getByTestId('payout-save').click();
  await expect(card.getByRole('alert')).toBeVisible();

  await card.getByTestId('bank-account').fill('5544332211');
  await card.getByTestId('payout-save').click();
  await expect(card.getByTestId('payout-current')).toHaveText('Hatton National Bank ••••2211');
});
