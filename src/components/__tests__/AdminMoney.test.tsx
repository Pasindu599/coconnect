// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PayoutsTab } from '../admin/PayoutsTab';
import { DisputesTab } from '../admin/DisputesTab';
import { store } from '../../lib/store';
import { snapshotStore } from '../../test/storeSnapshot';

let restore: () => void;
beforeEach(() => {
  restore = snapshotStore();
});
afterEach(() => {
  cleanup();
  store.logout();
  restore();
});

const asAdmin = () => {
  store.logout();
  store.adminLogin('niluka.fernando@coconnect.gov.lk', '9999');
};
const asOwner = () => {
  store.logout();
  store.verifyOtp('+94771234567', '123456', 'owner');
};
const award = (id: string) => store.getState().awards.find(a => a.id === id)!;

/** award-302 (job-102, broker Kusal Mendis) signed off by its owner, waiting for a payout */
const requestRelease = () => {
  asOwner();
  store.confirmCompletion('job-102', '1234');
  asAdmin();
};
const renderPayouts = () => render(<PayoutsTab state={store.getState()} currentLang="en" />);

describe('PayoutsTab', () => {
  it('says so when nothing is waiting', () => {
    asAdmin();
    renderPayouts();
    expect(screen.getByTestId('payouts-empty')).toBeTruthy();
    expect(screen.queryByTestId('payout-row')).toBeNull();
  });

  it('shows who to pay, how much, and the full account number', () => {
    store.getState().users.find(u => u.id === 'user-sup-1')!.payout_bank_ref = 'COM 11223344';
    requestRelease();
    renderPayouts();
    const row = within(screen.getByTestId('payout-row'));
    expect(row.getByTestId('payout-amount').textContent).toBe('LKR 35,000');
    expect(row.getByText(/Kusal Mendis/)).toBeTruthy();
    expect(row.getByTestId('payout-account-line').textContent).toContain('Commercial Bank');
    expect(row.getByTestId('payout-account-line').textContent).toContain('11223344'); // unmasked: the admin must transfer to it
  });

  it('will not pay someone with no payout account', () => {
    requestRelease();
    renderPayouts();
    expect(screen.getByTestId('payout-no-account')).toBeTruthy();
    expect((screen.getByTestId('payout-record') as HTMLButtonElement).disabled).toBe(true);
  });

  it('needs a transfer reference, then records the payout and releases the escrow', () => {
    store.getState().users.find(u => u.id === 'user-sup-1')!.payout_bank_ref = 'COM 11223344';
    requestRelease();
    const { rerender } = renderPayouts();

    fireEvent.click(screen.getByTestId('payout-record'));
    expect(screen.getByRole('alert').textContent).toContain('transfer reference');
    expect(award('award-302').escrow_status).toBe('release_requested');

    fireEvent.change(screen.getByTestId('payout-ref'), { target: { value: 'TRX-9001' } });
    fireEvent.click(screen.getByTestId('payout-record'));
    expect(award('award-302')).toMatchObject({ escrow_status: 'released', payout_ref: 'TRX-9001' });

    rerender(<PayoutsTab state={store.getState()} currentLang="en" />);
    expect(screen.getByTestId('payouts-empty')).toBeTruthy();
    expect(screen.getByTestId('payout-history').textContent).toContain('TRX-9001');
  });

  it('is available in Sinhala', () => {
    asAdmin();
    render(<PayoutsTab state={store.getState()} currentLang="si" />);
    expect(screen.getByTestId('payouts-empty').textContent).toBe('ගෙවීම් කිසිවක් බලාපොරොත්තුවෙන් නැත.');
  });
});

describe('DisputesTab', () => {
  const openDispute = () => {
    asOwner();
    const res = store.openDispute({ award_id: 'award-302', reason_code: 'POOR_WORKMANSHIP', description: 'Half the palms were missed.' });
    asAdmin();
    return res.success ? res.dispute.id : '';
  };
  const renderDisputes = () => render(<DisputesTab state={store.getState()} currentLang="en" />);
  const card = (id: string) => screen.getAllByTestId('dispute-card').find(c => c.dataset.disputeId === id)!;

  it('shows the frozen amount and a refund / release decision for an escrow dispute', () => {
    const id = openDispute();
    renderDisputes();
    const c = within(card(id));
    expect(c.getByTestId('dispute-frozen').textContent).toContain('LKR 35,000');
    expect(c.getByTestId('outcome-refunded')).toBeTruthy();
    expect(c.getByTestId('outcome-released')).toBeTruthy();
  });

  it('needs a reason before deciding', () => {
    const id = openDispute();
    renderDisputes();
    fireEvent.click(within(card(id)).getByTestId('dispute-resolve'));
    expect(within(card(id)).getByRole('alert').textContent).toContain('reason for the decision');
    expect(award('award-302').escrow_status).toBe('disputed');
  });

  it.each([
    ['refunded', 'refunded'],
    ['released', 'released'],
  ] as const)('%s: ends the freeze and records the decision', (outcome, expected) => {
    const id = openDispute();
    const { rerender } = renderDisputes();
    const c = () => within(card(id));
    fireEvent.click(c().getByTestId(`outcome-${outcome}`));
    fireEvent.change(c().getByTestId('dispute-notes'), { target: { value: 'Checked the site log and photos.' } });
    fireEvent.click(c().getByTestId('dispute-resolve'));

    expect(award('award-302').escrow_status).toBe(expected);
    rerender(<DisputesTab state={store.getState()} currentLang="en" />);
    expect(card(id).dataset.disputeStatus).toBe('resolved');
    expect(c().getByTestId('dispute-resolution').textContent).toContain('Checked the site log and photos.');
  });

  it('keeps the text-only resolution for exceptions that are not about escrow, with no refund option', () => {
    asAdmin();
    renderDisputes();
    const other = card('exc-901'); // an attendance exception
    expect(within(other).queryByTestId('outcome-refunded')).toBeNull();
    fireEvent.click(within(other).getByTestId('dispute-resolve'));
    expect(store.getState().exceptions.find(e => e.id === 'exc-901')!.status).toBe('resolved');
  });

  it('lists open disputes before resolved ones', () => {
    const id = openDispute();
    store.adminResolveException('exc-901', 'Wage adjusted.');
    renderDisputes();
    const order = screen.getAllByTestId('dispute-card').map(c => c.dataset.disputeStatus);
    expect(order.indexOf('open')).toBeLessThan(order.indexOf('resolved'));
    expect(card(id).dataset.disputeStatus).toBe('open');
  });
});
