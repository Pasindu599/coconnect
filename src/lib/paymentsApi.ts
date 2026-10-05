import type { FeeBreakdown, PayHereCheckout } from '../types/payments';
import { mockConfirmPayment, mockCreatePayment } from './payments.mock';
import { createPayment as liveCreatePayment } from './payments';
import { startPayHereCheckout, type CheckoutHandlers } from './payhereCheckout';
import { usesBackend } from './authApi';

export interface PaymentsApi {
  /** True while payments are the in-browser sandbox stand-in: no PayHere popup, no server. */
  isMock: boolean;
  createPayment: (awardId: string) => Promise<{ checkout: PayHereCheckout; fees: FeeBreakdown }>;
  /** Takes the payment. The escrow only becomes `held` through the webhook, never from here. */
  startCheckout: (awardId: string, checkout: PayHereCheckout, handlers: CheckoutHandlers) => Promise<void>;
}

/** The sandbox stand-in — no PayHere popup, no server. What e2e and demo mode use. */
export const mockPaymentsApi: PaymentsApi = {
  isMock: true,
  createPayment: mockCreatePayment,
  startCheckout: async (awardId, _checkout, handlers) => {
    mockConfirmPayment(awardId);
    handlers.onCompleted();
  },
};

/**
 * The real thing (SP5, S1-09): the create-payment Edge Function and the real
 * PayHere popup, live against the sandbox merchant id/secret set as Edge
 * Function secrets. The escrow still only becomes `held` through the
 * payhere-notify webhook, never from this call.
 */
export const livePaymentsApi: PaymentsApi = {
  isMock: false,
  createPayment: liveCreatePayment,
  startCheckout: (_awardId, checkout, handlers) => startPayHereCheckout(checkout, handlers),
};

/**
 * Same gate as `authApi` (`usesBackend` / `VITE_AUTH_MODE=supabase`) — an
 * award only exists in the database once the caller is really signed in to
 * Supabase, so there is nothing for the real `createPayment` to read
 * otherwise. Demo mode and e2e (which never set `VITE_AUTH_MODE`) keep
 * getting the mock unchanged.
 */
export const paymentsApi: PaymentsApi = usesBackend ? livePaymentsApi : mockPaymentsApi;

/** Kept as a named export for anything that imports the live path directly. */
export const livePayHereStartCheckout = (checkout: PayHereCheckout, handlers: CheckoutHandlers) =>
  startPayHereCheckout(checkout, handlers);
