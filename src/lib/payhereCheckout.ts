import type { PayHereCheckout } from '../types/payments';

/** The slice of the PayHere JS SDK (https://www.payhere.lk/lib/payhere.js) the checkout uses. */
interface PayHereSdk {
  startPayment: (payment: PayHereCheckout) => void;
  onCompleted: (orderId: string) => void;
  onDismissed: () => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    payhere?: PayHereSdk;
  }
}

export const PAYHERE_SDK_URL = 'https://www.payhere.lk/lib/payhere.js';

let sdkLoading: Promise<PayHereSdk> | null = null;

/** Loads the PayHere SDK on first use only, so pages that never take a payment do not load it. */
export const loadPayHereSdk = (): Promise<PayHereSdk> => {
  if (window.payhere) return Promise.resolve(window.payhere);
  if (!sdkLoading) {
    sdkLoading = new Promise<PayHereSdk>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PAYHERE_SDK_URL;
      script.async = true;
      script.onload = () => (window.payhere ? resolve(window.payhere) : reject(new Error('PayHere SDK missing')));
      script.onerror = () => {
        sdkLoading = null; // let the next attempt retry
        reject(new Error('PayHere SDK failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkLoading;
};

export interface CheckoutHandlers {
  /** The popup reports success. The payment is only real once the webhook has held the escrow. */
  onCompleted: () => void;
  onDismissed: () => void;
  onError: (message: string) => void;
}

/** Opens the PayHere checkout popup with parameters signed by the server. */
export const startPayHereCheckout = async (checkout: PayHereCheckout, handlers: CheckoutHandlers): Promise<void> => {
  const sdk = await loadPayHereSdk();
  sdk.onCompleted = () => handlers.onCompleted();
  sdk.onDismissed = () => handlers.onDismissed();
  sdk.onError = (message: string) => handlers.onError(message);
  sdk.startPayment(checkout);
};
