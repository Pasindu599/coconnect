import type { FeeBreakdown, PayHereCheckout } from '../types/payments';
import { mockConfirmPayment, mockCreatePayment } from './payments.mock';
import { startPayHereCheckout, type CheckoutHandlers } from './payhereCheckout';

export interface PaymentsApi {
  /** True while payments are the in-browser sandbox stand-in: no PayHere popup, no server. */
  isMock: boolean;
  createPayment: (awardId: string) => Promise<{ checkout: PayHereCheckout; fees: FeeBreakdown }>;
  /** Takes the payment. The escrow only becomes `held` through the webhook, never from here. */
  startCheckout: (awardId: string, checkout: PayHereCheckout, handlers: CheckoutHandlers) => Promise<void>;
}

/**
 * The checkout UI talks to this seam. Today it is the sandbox stand-in; when Session 1 ships
 * `src/lib/payments.ts` (S1-09), point `createPayment` there and set `isMock: false`: the
 * PayHere popup path below is already live code.
 */
export const paymentsApi: PaymentsApi = {
  isMock: true,
  createPayment: mockCreatePayment,
  startCheckout: async (awardId, _checkout, handlers) => {
    mockConfirmPayment(awardId);
    handlers.onCompleted();
  },
};

/** The real thing, ready for when `isMock` is false. */
export const livePayHereStartCheckout = (checkout: PayHereCheckout, handlers: CheckoutHandlers) =>
  startPayHereCheckout(checkout, handlers);
