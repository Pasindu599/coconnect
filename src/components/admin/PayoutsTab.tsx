import React, { useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2 } from 'lucide-react';
import { store, AppState, type PayoutError } from '../../lib/store';
import { Award } from '../../types';
import { Language, fmt, tTaskType } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { categoryOf, getCategory, l10n } from '../../config/categories';
import { bankName, parseBankRef } from '../../lib/bank';
import { formatMoney } from '../../lib/money';
import { NoticeBanner } from '../common/NoticeBanner';

interface PayoutsTabProps {
  state: AppState;
  currentLang: Language;
}

interface PayoutRowProps {
  state: AppState;
  currentLang: Language;
  award: Award;
  onPaid: (message: string) => void;
}

/** One confirmed job waiting to be paid: who, how much, where, and a field for the transfer reference. */
const PayoutRow: React.FC<PayoutRowProps> = ({ state, currentLang, award, onPaid }) => {
  const t = useT(currentLang);
  const [reference, setReference] = useState('');
  const [error, setError] = useState<PayoutError | null>(null);

  const job = state.jobs.find(j => j.id === award.job_id);
  const payee = state.users.find(u => u.id === award.supervisor_id);
  const account = parseBankRef(payee?.payout_bank_ref);
  const category = getCategory(categoryOf(job));

  const errorText: Record<PayoutError, string> = {
    unauthorized: t.admin_403_title,
    'not-found': t.payout_err_state,
    'not-awaiting-payout': t.payout_err_state,
    'reference-required': t.payout_err_ref,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = store.recordPayout(award.id, reference);
    if (result.success) onPaid(t.payout_recorded);
    else setError(result.error);
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="payout-row"
      data-award-id={award.id}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-950 text-purple-300 border border-purple-800">
            {l10n(category.label, currentLang)}
          </span>
          <h4 className="text-sm font-bold text-white mt-1.5">{tTaskType(job?.task_type, currentLang)}</h4>
          <p className="text-xs text-slate-400">
            {t.payout_to}: <strong className="text-slate-200">{award.supervisor_name}</strong>
            {payee?.phone && <span className="font-mono"> • {payee.phone}</span>}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">{t.payout_amount}</div>
          <div className="text-lg font-bold text-emerald-400 font-mono" data-testid="payout-amount">{formatMoney(award.escrow_amount, currentLang)}</div>
        </div>
      </div>

      {account ? (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2" data-testid="payout-account-line">
          <Banknote className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-200">{bankName(account.code)}</span>
          {/* The admin needs the full number to make the transfer */}
          <span className="font-mono text-white">{account.account}</span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center space-x-2" data-testid="payout-no-account">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{t.payout_no_account}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">{t.payout_ref_label}</label>
          <input
            data-testid="payout-ref"
            type="text"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              setError(null);
            }}
            placeholder={t.payout_ref_ph}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
          />
        </div>
        <button
          type="submit"
          data-testid="payout-record"
          disabled={!account}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md whitespace-nowrap"
        >
          {t.payout_record}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[11px] text-rose-300">
          {errorText[error]}
        </p>
      )}
    </form>
  );
};

/** Jobs the client has signed off, waiting for an admin to send the money and record the transfer. */
export const PayoutsTab: React.FC<PayoutsTabProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);
  const [notice, setNotice] = useState<string | null>(null);

  const waiting = state.awards.filter(a => a.escrow_status === 'release_requested');
  const paid = state.awards
    .filter(a => a.escrow_status === 'released' && a.payout_ref)
    .sort((a, b) => (b.payout_at ?? '').localeCompare(a.payout_at ?? ''))
    .slice(0, 10);

  return (
    <div className="space-y-4" data-testid="payouts-tab">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Banknote className="w-5 h-5 text-emerald-400" />
          <span>{t.payouts_title}</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">{t.payouts_desc}</p>
      </div>

      {notice && <NoticeBanner message={notice} />}

      {waiting.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl" data-testid="payouts-empty">
          {t.payouts_empty}
        </div>
      ) : (
        <div className="space-y-4">
          {waiting.map(award => (
            <PayoutRow key={award.id} state={state} currentLang={currentLang} award={award} onPaid={setNotice} />
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-2" data-testid="payout-history">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.payout_history_title}</h4>
          {paid.map(award => {
            const job = state.jobs.find(j => j.id === award.job_id);
            return (
              <div key={award.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 truncate">
                    {award.supervisor_name} • {tTaskType(job?.task_type, currentLang)}
                  </span>
                </div>
                <div className="text-right text-slate-400 flex-shrink-0 pl-3">
                  <div className="font-mono text-slate-200">{formatMoney(award.escrow_amount, currentLang)}</div>
                  <div className="text-[10px]">
                    {fmt(t.payout_paid_on, { date: new Date(award.payout_at ?? '').toLocaleDateString(), ref: award.payout_ref ?? '' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
