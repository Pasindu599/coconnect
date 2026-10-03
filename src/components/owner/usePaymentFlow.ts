import { useCallback, useEffect, useRef, useState } from 'react';
import { paymentsApi } from '../../lib/paymentsApi';
import type { FeeBreakdown, PayHereCheckout } from '../../types/payments';

export type PaymentPhase = 'loading' | 'ready' | 'opening' | 'waiting' | 'cancelled' | 'error';

/**
 * The checkout steps for one award: ask the server for the fee breakdown and signed
 * checkout, let the user pay, then wait. The hook never marks money as held: the caller
 * watches the award's `escrow_status`, which only the webhook changes.
 */
export const usePaymentFlow = (awardId: string) => {
  const [phase, setPhase] = useState<PaymentPhase>('loading');
  const [fees, setFees] = useState<FeeBreakdown | null>(null);
  const [checkout, setCheckout] = useState<PayHereCheckout | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    paymentsApi
      .createPayment(awardId)
      .then(result => {
        if (cancelled) return;
        setFees(result.fees);
        setCheckout(result.checkout);
        setPhase('ready');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [awardId, attempt]);

  const retry = useCallback(() => setAttempt(n => n + 1), []);

  const pay = useCallback(async () => {
    if (!checkout) return;
    setPhase('opening');
    try {
      await paymentsApi.startCheckout(awardId, checkout, {
        onCompleted: () => mounted.current && setPhase('waiting'),
        onDismissed: () => mounted.current && setPhase('cancelled'),
        onError: () => mounted.current && setPhase('error'),
      });
    } catch {
      if (mounted.current) setPhase('error');
    }
  }, [awardId, checkout]);

  return { phase, fees, checkout, pay, retry, isMock: paymentsApi.isMock };
};
