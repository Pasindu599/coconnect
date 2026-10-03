// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Award } from '../../types';

vi.mock('../../lib/paymentsApi', () => ({
  paymentsApi: {
    isMock: true,
    createPayment: vi.fn(),
    startCheckout: vi.fn(),
  },
}));

import { paymentsApi } from '../../lib/paymentsApi';
import { EscrowPaymentModal } from '../owner/EscrowPaymentModal';
import { store } from '../../lib/store';

const api = paymentsApi as unknown as {
  createPayment: ReturnType<typeof vi.fn>;
  startCheckout: ReturnType<typeof vi.fn>;
};

const fees = { bidPrice: 100000, platformFee: 5000, total: 105000, currency: 'LKR' as const };
const checkout = { amount: '105000.00', order_id: 'p1' };

const award = (overrides: Partial<Award> = {}): Award => ({
  id: 'award-x',
  job_id: 'job-x',
  bid_id: 'bid-x',
  supervisor_id: 'u',
  supervisor_name: 'Ranjith Silva',
  awarded_at: '2026-10-01T00:00:00Z',
  escrow_status: 'pending',
  escrow_amount: 100000,
  ...overrides,
});

const stateWith = (a: Award) => ({ ...store.getState(), awards: [a] });

beforeEach(() => {
  api.createPayment.mockReset().mockResolvedValue({ checkout, fees });
  api.startCheckout.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('EscrowPaymentModal', () => {
  it('shows the fee breakdown the server returned', async () => {
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />);
    await screen.findByTestId('payment-total');
    expect(screen.getByTestId('payment-total').textContent).toBe('LKR 105,000');
    expect(screen.getByTestId('payment-fee').textContent).toContain('LKR 5,000');
    expect(api.createPayment).toHaveBeenCalledWith('award-x');
  });

  it('cannot be paid before the payment is prepared', () => {
    api.createPayment.mockReturnValue(new Promise(() => {}));
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />);
    expect((screen.getByTestId('pay-button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Preparing your payment…')).toBeTruthy();
  });

  it('offers a retry when the payment cannot be prepared, and recovers', async () => {
    api.createPayment.mockRejectedValueOnce(new Error('boom'));
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />);
    await screen.findByText('We could not prepare the payment. You have not been charged. Please try again.');
    expect(screen.queryByTestId('pay-button')).toBeNull();

    fireEvent.click(screen.getByText('Try again'));
    await screen.findByTestId('payment-total');
    expect(api.createPayment).toHaveBeenCalledTimes(2);
  });

  it('waits after paying and never marks the escrow held itself', async () => {
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />);
    await screen.findByTestId('payment-total');
    api.startCheckout.mockImplementation(async (_id, _checkout, handlers) => handlers.onCompleted());

    fireEvent.click(screen.getByTestId('pay-button'));
    await screen.findByTestId('payment-waiting');
    expect(screen.queryByTestId('payment-held')).toBeNull();
    expect(api.startCheckout).toHaveBeenCalledWith('award-x', checkout, expect.any(Object));
  });

  it('shows "held" only once the award itself is held', async () => {
    const { rerender } = render(
      <EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />
    );
    await screen.findByTestId('payment-total');
    expect(screen.queryByTestId('payment-held')).toBeNull();

    const held = award({ escrow_status: 'held' });
    await act(async () => {
      rerender(<EscrowPaymentModal state={stateWith(held)} currentLang="en" award={award()} onClose={() => {}} />);
    });
    expect(screen.getByTestId('payment-held').textContent).toContain('held in escrow');
  });

  it('lets the person try again after dismissing the checkout', async () => {
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={() => {}} />);
    await screen.findByTestId('payment-total');
    api.startCheckout.mockImplementation(async (_id, _checkout, handlers) => handlers.onDismissed());

    fireEvent.click(screen.getByTestId('pay-button'));
    await screen.findByText('The payment was cancelled. You have not been charged.');
    await waitFor(() => expect((screen.getByTestId('pay-button') as HTMLButtonElement).disabled).toBe(false));
  });

  it('closes without paying', async () => {
    const onClose = vi.fn();
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="en" award={award()} onClose={onClose} />);
    await screen.findByTestId('payment-total');
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
    expect(api.startCheckout).not.toHaveBeenCalled();
  });

  it('is translated', async () => {
    render(<EscrowPaymentModal state={stateWith(award())} currentLang="si" award={award()} onClose={() => {}} />);
    await screen.findByTestId('payment-total');
    expect(screen.getByText('ගෙවීම් විස්තරය')).toBeTruthy();
  });
});
