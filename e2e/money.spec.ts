import { expect, test } from '@playwright/test';
import { HELD_JOB, completeHeldJob, signIn, signInAdmin, signOut } from './helpers';

const jobCard = (page: import('@playwright/test').Page) =>
  page.locator(`[data-testid="job-card"][data-job-task="${HELD_JOB.task}"]`);

test('after sign-off an admin pays the contractor out and the escrow is released', async ({ page }) => {
  // The contractor tells Coconnect where to send the money
  await signIn(page, 'construction', 'contractor');
  await page.goto('/#/construction/profile');
  const account = page.getByTestId('payout-account');
  await account.getByTestId('bank-code').selectOption('BOC');
  await account.getByTestId('bank-account').fill('55667788');
  await account.getByTestId('payout-save').click();
  await expect(account.getByTestId('payout-current')).toHaveText('Bank of Ceylon ••••7788');
  await signOut(page);

  await completeHeldJob(page);
  await signOut(page);

  // The admin sees what to send, and where
  await signInAdmin(page);
  await page.getByTestId('admin-tab-payouts').click();
  const row = page.getByTestId('payout-row').and(page.locator(`[data-award-id="${HELD_JOB.award}"]`));
  await expect(row.getByTestId('payout-amount')).toHaveText(HELD_JOB.amount);
  await expect(row.getByTestId('payout-account-line')).toContainText('Bank of Ceylon');
  await expect(row.getByTestId('payout-account-line')).toContainText('55667788'); // the full number: they need it to transfer

  // A reference is required before anything is recorded
  await row.getByTestId('payout-record').click();
  await expect(row.getByRole('alert')).toContainText('transfer reference');
  await expect(row).toBeVisible();

  await row.getByTestId('payout-ref').fill('TRX-20261003-0042');
  await row.getByTestId('payout-record').click();
  await expect(page.getByText('Payout recorded. The escrow is released.')).toBeVisible();
  await expect(page.getByTestId('payouts-empty')).toBeVisible();
  await expect(page.getByTestId('payout-history')).toContainText('TRX-20261003-0042');
  await signOut(page).catch(() => {}); // the admin portal has no account menu; ignore

  // Both sides now see the money paid out
  await signIn(page, 'construction', 'client');
  await expect(jobCard(page).getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'released');
  await expect(jobCard(page).getByTestId('escrow-step-paid_out')).toHaveAttribute('data-state', 'done');
});

test('an admin cannot pay a contractor who has not given a payout account', async ({ page }) => {
  await completeHeldJob(page);
  await signInAdmin(page);
  await page.getByTestId('admin-tab-payouts').click();
  const row = page.getByTestId('payout-row').and(page.locator(`[data-award-id="${HELD_JOB.award}"]`));
  await expect(row.getByTestId('payout-no-account')).toBeVisible();
  await expect(row.getByTestId('payout-record')).toBeDisabled();
});

test('the payout queue is empty before anyone has signed a job off', async ({ page }) => {
  await signInAdmin(page);
  await page.getByTestId('admin-tab-payouts').click();
  await expect(page.getByTestId('payouts-empty')).toBeVisible();
});

async function openDisputeAsClient(page: import('@playwright/test').Page) {
  await signIn(page, 'construction', 'client');
  await jobCard(page).getByTestId('open-dispute').click();
  const modal = page.getByTestId('dispute-modal');

  // A real description is required
  await modal.getByTestId('dispute-description').fill('short');
  await modal.getByTestId('dispute-submit').click();
  await expect(modal.getByRole('alert')).toContainText('at least 10 characters');
  await expect(jobCard(page).getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'held');

  await modal.getByTestId('dispute-reason').selectOption('WAGE_DISPUTE');
  await modal.getByTestId('dispute-description').fill('The agreed daily rate was not honoured on site.');
  await modal.getByTestId('dispute-submit').click();
  await expect(page.getByText('Dispute opened. The escrow is frozen until an admin resolves it.')).toBeVisible();
}

test('opening a dispute freezes the escrow for both sides and reaches the admin', async ({ page }) => {
  await openDisputeAsClient(page);

  // The money is frozen: no sign-off is possible and the timeline says why
  const card = jobCard(page);
  await expect(card.getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'disputed');
  await expect(card.getByRole('status')).toContainText('frozen');
  await expect(card.getByTestId('verify-release')).toHaveCount(0);
  await expect(card.getByTestId('open-dispute')).toHaveCount(0); // already disputed
  await signOut(page);

  // The contractor sees it too
  await signIn(page, 'construction', 'contractor');
  await page.getByTestId('tab-completions').click();
  await expect(page.locator('[data-testid="escrow-timeline"][data-status="disputed"]')).toBeVisible();
  await signOut(page);

  // The admin has it in the dispute desk, with the frozen amount
  await signInAdmin(page);
  await page.getByTestId('admin-tab-disputes').click();
  const dispute = page.getByTestId('dispute-card').filter({ hasText: 'The agreed daily rate was not honoured' });
  await expect(dispute).toHaveAttribute('data-dispute-status', 'open');
  await expect(dispute.getByTestId('dispute-frozen')).toContainText('LKR 145,000');
});

test('an admin refunds a disputed payment: a reason is required, and it cannot be funded again', async ({ page }) => {
  await openDisputeAsClient(page);
  await signOut(page);

  await signInAdmin(page);
  await page.getByTestId('admin-tab-disputes').click();
  const dispute = page.getByTestId('dispute-card').filter({ hasText: 'The agreed daily rate was not honoured' });
  await dispute.getByTestId('outcome-refunded').check();
  await dispute.getByTestId('dispute-resolve').click(); // no reason yet
  await expect(dispute.getByRole('alert')).toContainText('reason for the decision');
  await expect(dispute).toHaveAttribute('data-dispute-status', 'open');

  await dispute.getByTestId('dispute-notes').fill('Gate log confirms the shortfall; refunding the client.');
  await dispute.getByTestId('dispute-resolve').click();
  await expect(dispute).toHaveAttribute('data-dispute-status', 'resolved');
  await expect(dispute.getByTestId('dispute-resolution')).toContainText('Refunded');

  // The client sees the refund and cannot dispute or pay again
  await signIn(page, 'construction', 'client');
  const card = jobCard(page);
  await expect(card.getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'refunded');
  await expect(card.getByRole('status')).toContainText('refunded');
  await expect(card.getByTestId('open-dispute')).toHaveCount(0);
});

test('an admin can instead release a disputed payment', async ({ page }) => {
  await openDisputeAsClient(page);
  await signOut(page);

  await signInAdmin(page);
  await page.getByTestId('admin-tab-disputes').click();
  const dispute = page.getByTestId('dispute-card').filter({ hasText: 'The agreed daily rate was not honoured' });
  await dispute.getByTestId('outcome-released').check();
  await dispute.getByTestId('dispute-notes').fill('Work was completed to the agreed standard.');
  await dispute.getByTestId('dispute-resolve').click();
  await expect(dispute.getByTestId('dispute-resolution')).toContainText('Released');

  await signIn(page, 'construction', 'client');
  await expect(jobCard(page).getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'released');
});
