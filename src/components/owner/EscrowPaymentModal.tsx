import React from 'react';
import { AppState } from '../../lib/store';
import { Award } from '../../types';
import { Language, fmt } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { contactsUnlocked } from '../../config/escrow';
import { usePaymentFlow } from './usePaymentFlow';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, X } from 'lucide-react';

interface EscrowPaymentModalProps {
  state: AppState;
  currentLang: Language;
  award: Award;
  onClose: () => void;
}

const lkr = (amount: number) => `LKR ${amount.toLocaleString()}`;

/**
 * Pays an award into escrow: fee breakdown, PayHere checkout, then a waiting state that ends
 * when the escrow is `held`. Only the payment webhook can hold the escrow, so this modal
 * reads the award's status from state and never sets it.
 */
export const EscrowPaymentModal: React.FC<EscrowPaymentModalProps> = ({ state, currentLang, award, onClose }) => {
  const t = useT(currentLang);
  const { phase, fees, pay, retry, isMock } = usePaymentFlow(award.id);

  const live = state.awards.find(a => a.id === award.id) ?? award;
  // Paid = the money is in escrow or beyond; set only by the webhook, never by this modal
  const isHeld = contactsUnlocked(live.escrow_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" data-testid="payment-modal">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
            <CreditCard className="w-5 h-5" />
            <span>{t.escrow_deposit_title}</span>
          </div>
          <button onClick={onClose} aria-label={t.pay_close} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isHeld ? (
          <div data-testid="payment-held" className="space-y-3 text-center py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">{t.pay_held_title}</h3>
            <p className="text-xs text-slate-300">{t.pay_held_desc}</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
              {t.pay_close}
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-300">{fmt(t.escrow_deposit_desc, { id: award.id })}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{t.supervisor_label}:</span>
                <strong className="text-white">{award.supervisor_name}</strong>
              </div>

              {fees ? (
                <>
                  <div className="pt-2 border-t border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                    {t.pay_breakdown_title}
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{t.pay_bid_price}</span>
                    <span className="font-mono">{lkr(fees.bidPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300" data-testid="payment-fee">
                    <span>{t.pay_platform_fee}</span>
                    <span className="font-mono">{lkr(fees.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>{t.pay_total}</span>
                    <span className="text-emerald-400 font-mono" data-testid="payment-total">{lkr(fees.total)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">{t.pay_fee_note}</p>
                </>
              ) : (
                <div className="flex items-center space-x-2 text-slate-400 py-2">
                  {phase === 'error' ? null : <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{phase === 'error' ? t.pay_error : t.pay_loading}</span>
                </div>
              )}
            </div>

            {phase === 'error' && fees && (
              <div role="alert" className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {t.pay_error}
              </div>
            )}
            {phase === 'cancelled' && (
              <div role="status" className="p-3 rounded-xl bg-amber-950/50 border border-amber-800 text-amber-200 text-xs">
                {t.pay_cancelled}
              </div>
            )}
            {isMock && <p className="text-[11px] text-amber-300">{t.pay_sandbox_note}</p>}

            {phase === 'waiting' ? (
              <div data-testid="payment-waiting" className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                <h3 className="text-sm font-bold text-white">{t.pay_waiting_title}</h3>
                <p className="text-[11px] text-slate-400">{t.pay_waiting_desc}</p>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  {t.common_cancel}
                </button>
                {phase === 'error' ? (
                  <button
                    type="button"
                    onClick={retry}
                    className="w-2/3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    {t.pay_retry}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="pay-button"
                    disabled={phase !== 'ready' && phase !== 'cancelled'}
                    onClick={pay}
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1"
                  >
                    {phase === 'opening' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{phase === 'opening' ? t.pay_opening : isMock ? t.pay_simulate : t.pay_with_payhere}</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
