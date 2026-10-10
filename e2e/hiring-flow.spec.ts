import { expect, test } from '@playwright/test';
import { signIn, signOut, type Category } from './helpers';

interface Flow {
  category: Category;
  poster: string;
  bidder: string;
  /** A task type the seeded data does not use, so the new job is easy to spot. */
  task: string;
  /** The bidder's phone number: it must stay hidden until the escrow is funded. */
  bidderPhone: string;
  /** What the poster sees in the payment breakdown for the seeded bid on the new job. */
  siteLabel: RegExp;
}

const FLOWS: Flow[] = [
  {
    category: 'construction',
    poster: 'client',
    bidder: 'contractor',
    task: 'Tiling & Floor Finishing',
    bidderPhone: '+94772000002',
    siteLabel: /construction site/i,
  },
  {
    category: 'coconut',
    poster: 'owner',
    bidder: 'agent',
    task: 'Undergrowth Tractor Clearing',
    bidderPhone: '+94719876543',
    siteLabel: /coconut estate/i,
  },
];

for (const flow of FLOWS) {
  test(`${flow.category}: post a job, bid on it, award it, pay into escrow and see the contacts`, async ({ page }) => {
    const note = `e2e ${flow.category} ${Date.now()}`;
    // The task types below are not used by any seeded job, so the new job can be found by its task.
    const task = flow.task;

    // 1. The poster publishes a job
    await signIn(page, flow.category, flow.poster);
    await page.getByTestId('post-job').click();
    await expect(page.getByText(flow.siteLabel).first()).toBeVisible();
    await page.getByTestId('job-task-type').selectOption(flow.task);
    // Fixed dates well after the seeded jobs, so the worker-overlap check cannot depend on today's date
    await page.getByTestId('job-start').fill('2027-03-01');
    await page.getByTestId('job-end').fill('2027-03-02');
    await page.getByTestId('job-description').fill(note);
    await page.getByTestId('publish-job').click();

    const postedCard = page.getByTestId('job-card').and(page.locator(`[data-job-task="${task}"]`));
    await expect(postedCard).toHaveAttribute('data-job-status', 'OPEN');
    await signOut(page);

    // 2. The bidder bids with their crew
    await signIn(page, flow.category, flow.bidder);
    await page.getByTestId('tab-marketplace').click();
    const openJob = page.getByTestId('open-job-card').and(page.locator(`[data-job-task="${task}"]`));
    await expect(openJob).toBeVisible();
    await openJob.getByTestId('place-bid').click();
    await page.getByTestId('submit-bid').click();
    await expect(openJob).toContainText(/your bid/i);
    await signOut(page);

    // 3. The poster awards the bid; the contacts stay locked until the payment is held
    await signIn(page, flow.category, flow.poster);
    await postedCard.getByTestId('review-bids').click();
    await expect(page.getByText(flow.bidderPhone)).toHaveCount(0);
    await page.getByTestId('accept-bid').click();

    const modal = page.getByTestId('payment-modal');
    await expect(modal.getByTestId('payment-total')).toBeVisible();
    await expect(modal.getByTestId('payment-fee')).toContainText('LKR');
    await expect(page.getByText(flow.bidderPhone)).toHaveCount(0);

    // 4. Pay: the money is only "held" once the (stand-in) webhook confirms it
    await modal.getByTestId('pay-button').click();
    await expect(modal.getByTestId('payment-waiting')).toBeVisible();
    await expect(modal.getByTestId('payment-held')).toBeVisible({ timeout: 10_000 });
    await modal.getByTestId('payment-held').getByRole('button').click();

    // 5. The job is active and the contacts are now visible
    await expect(postedCard).toHaveAttribute('data-job-status', 'ACTIVE');
    await expect(postedCard.getByTestId('escrow-timeline')).toHaveAttribute('data-status', 'held');
    await postedCard.getByTestId('view-contacts').click();
    await expect(page.getByTestId('contact-phone')).toHaveText(flow.bidderPhone);
  });
}
